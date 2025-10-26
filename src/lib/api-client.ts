interface RequestOptions extends RequestInit {
  authToken?: string;
}

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { authToken, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Request failed",
      }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // User API
  async getUser(authToken: string) {
    return this.request<{ user: any }>("/api/auth/user", {
      method: "GET",
      authToken,
    });
  }

  // Piggy Bank APIs
  async getPiggyBanks(authToken: string) {
    return this.request<{ piggyBanks: any[] }>("/api/piggy-banks", {
      method: "GET",
      authToken,
    });
  }

  async getPiggyBank(id: string, authToken: string) {
    return this.request<{ piggyBank: any }>(`/api/piggy-banks/${id}`, {
      method: "GET",
      authToken,
    });
  }

  async createPiggyBank(
    data: {
      name: string;
      goalAmount: string;
      goalDeadline?: string;
      contractAddress: string;
    },
    authToken: string,
  ) {
    return this.request<{ piggyBank: any }>("/api/piggy-banks", {
      method: "POST",
      authToken,
      body: JSON.stringify(data),
    });
  }

  async invitePartner(
    piggyBankId: string,
    partnerAddress: string,
    authToken: string,
  ) {
    return this.request<{ success: boolean }>(
      `/api/piggy-banks/${piggyBankId}/invite`,
      {
        method: "POST",
        authToken,
        body: JSON.stringify({ partnerAddress }),
      },
    );
  }

  async getTransactions(piggyBankId: string, authToken: string) {
    return this.request<{ transactions: any[] }>(
      `/api/piggy-banks/${piggyBankId}/transactions`,
      {
        method: "GET",
        authToken,
      },
    );
  }

  // Deposit API
  async recordDeposit(
    data: {
      contractAddress: string;
      amount: string;
      transactionHash: string;
    },
    authToken: string,
  ) {
    return this.request<{ transaction: any }>("/api/deposits/record", {
      method: "POST",
      authToken,
      body: JSON.stringify(data),
    });
  }

  // Withdrawal APIs
  async requestWithdrawal(
    data: {
      piggyBankId: string;
      amount: string;
    },
    authToken: string,
  ) {
    return this.request<{ withdrawal: any }>("/api/withdrawals/request", {
      method: "POST",
      authToken,
      body: JSON.stringify(data),
    });
  }

  async approveWithdrawal(withdrawalId: string, authToken: string) {
    return this.request<{ withdrawal: any }>(
      `/api/withdrawals/${withdrawalId}/approve`,
      {
        method: "POST",
        authToken,
      },
    );
  }

  // Notifications API
  async subscribeToNotifications(authToken: string) {
    return this.request<{ success: boolean }>("/api/notifications/subscribe", {
      method: "POST",
      authToken,
    });
  }
}

export const apiClient = new APIClient();
