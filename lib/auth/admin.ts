import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export interface AdminCheckResult {
  isAdmin: boolean
  userId: string | null
  error?: string
}

/**
 * Check if the current user has admin role
 * @returns AdminCheckResult with isAdmin flag and userId
 */
export async function checkAdminRole(): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        isAdmin: false,
        userId: null,
        error: 'Unauthorized'
      }
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!profile) {
      return {
        isAdmin: false,
        userId: user.id,
        error: 'Profile not found'
      }
    }

    return {
      isAdmin: profile.role === 'ADMIN',
      userId: user.id
    }
  } catch (error) {
    console.error('Error checking admin role:', error)
    return {
      isAdmin: false,
      userId: null,
      error: 'Internal server error'
    }
  }
}

/**
 * Get user's role from profile
 * @param userId User ID to check
 * @returns User's role or null if not found
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    return profile?.role ?? null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Check if user is admin by userId
 * @param userId User ID to check
 * @returns true if user has ADMIN role
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === 'ADMIN'
}
