import { pb } from '../lib/pocketbase'
import { profileService } from './profile.service'
import { programService } from './program.service'
import { consecutiveCompletedCount, indexProgressByDayId } from '../utils/programProgress'
import { alignedQuitDateIfBehind } from '../utils/quitDateSync'
import { SessionProgress } from '../types/models'

/**
 * If calendar days since quit_date exceed consecutive completed program days,
 * push quit_date forward so smoke-free days match session progress.
 * Returns the new quit_date when updated, otherwise null.
 */
export async function syncQuitDateWithSessions(userId: string): Promise<string | null> {
  const profile = await profileService.getByUserId(userId)
  if (!profile.success || !profile.data?.quit_date) return null

  const session = await pb
    .collection('user_sessions')
    .getFirstListItem(`user = "${userId}" && status != "completed"`)
    .catch(() =>
      pb.collection('user_sessions').getFirstListItem(`user = "${userId}"`).catch(() => null)
    )

  if (!session) return null

  const programId =
    typeof session.program === 'string' ? session.program : (session.program as { id?: string })?.id
  if (!programId) return null

  const daysResult = await programService.getProgramDays(programId)
  if (!daysResult.success || !daysResult.data?.length) return null

  const allProgress = await pb
    .collection('session_progress')
    .getFullList<SessionProgress>({
      filter: `user = "${userId}"`,
      fields: 'id,program_day,status',
    })
    .catch(() => [] as SessionProgress[])

  const completed = consecutiveCompletedCount(
    daysResult.data,
    indexProgressByDayId(allProgress)
  )
  const nextQuit = alignedQuitDateIfBehind(profile.data.quit_date, completed)
  if (!nextQuit) return null

  const updated = await profileService.upsert(userId, { quit_date: nextQuit })
  if (!updated.success) return null
  return nextQuit
}
