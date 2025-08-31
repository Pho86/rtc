import type { User, Department } from '../types'

class AuthService {
  private currentUser: User | null = null
  private readonly STORAGE_KEY = 'rtc_user'

  // Mock users for demonstration
  private mockUsers: User[] = [
    {
      id: '1',
      username: 'safe_homes_user',
      department: 'safe-homes',
      role: 'user'
    },
    {
      id: '2',
      username: 'prevention_user',
      department: 'prevention',
      role: 'user'
    },
    {
      id: '3',
      username: 'schools_user',
      department: 'schools',
      role: 'user'
    },
    {
      id: '4',
      username: 'outreach_user',
      department: 'outreach',
      role: 'user'
    },
    {
      id: '5',
      username: 'admin_user',
      department: 'admin',
      role: 'admin'
    }
  ]

  constructor() {
    this.loadUserFromStorage()
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Mock authentication - in real app, this would call an API
    const user = this.mockUsers.find(u => u.username === username)
    
    if (!user) {
      return { success: false, error: 'Invalid username or password' }
    }

    // Mock password validation (in real app, this would be properly hashed/validated)
    if (password !== 'password123') {
      return { success: false, error: 'Invalid username or password' }
    }

    this.currentUser = user
    this.saveUserToStorage()
    return { success: true }
  }

  logout(): void {
    this.currentUser = null
    localStorage.removeItem(this.STORAGE_KEY)
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  getUserDepartment(): Department | null {
    return this.currentUser?.department || null
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin'
  }

  private saveUserToStorage(): void {
    if (this.currentUser) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser))
    }
  }

  private loadUserFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored)
      } catch (error) {
        localStorage.removeItem(this.STORAGE_KEY)
      }
    }
  }
}

export const authService = new AuthService()
