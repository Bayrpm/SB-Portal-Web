import { ApiClient } from '../../../infrastructure/api/ApiClient';

export interface AuthenticationData {
  email: string;
  password: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  token: string;
}

export class AuthenticationService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  async login(email: string, password: string): Promise<UserData> {
    const response = await this.apiClient.post<UserData>('/auth/login', {
      email,
      password,
    });

    // Store token in localStorage or cookie
    if (response.token) {
      this.storeToken(response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.apiClient.post('/auth/logout');
    this.removeToken();
  }

  async refreshToken(): Promise<UserData> {
    const response = await this.apiClient.post<UserData>('/auth/refresh');
    
    if (response.token) {
      this.storeToken(response.token);
    }

    return response;
  }

  private storeToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }
}