import type { DsaProblem, UserProblemProgress, Difficulty } from '@/lib/types';

export interface RecommendationResult {
  problem: DsaProblem;
  reason: string;
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };
const SOLVED_STATUSES = new Set(['Solved with Hints', 'Solved Independently']);

/**
 * Rules-based recommendation engine.
 *
 * Considers:
 * - Problems needing revision
 * - Problems attempted but not solved
 * - User's preferred difficulty
 * - Topic coverage (recommends unsolved topics the user has started)
 * - Gradual difficulty progression
 *
 * Kept separate from UI so it can be improved or swapped later.
 */
export function recommendProblems(
  problems: DsaProblem[],
  progress: UserProblemProgress[],
  preferredDifficulty: Difficulty,
  limit = 4
): RecommendationResult[] {
  const progressMap = new Map(progress.map((p) => [p.problem_id, p.status]));
  const solvedTopicIds = new Set<string>();
  const solvedCount = { Easy: 0, Medium: 0, Hard: 0 };

  for (const p of progress) {
    if (SOLVED_STATUSES.has(p.status)) {
      const problem = problems.find((pr) => pr.id === p.problem_id);
      if (problem?.topic_id) solvedTopicIds.add(problem.topic_id);
      if (problem) solvedCount[problem.difficulty]++;
    }
  }

  const results: RecommendationResult[] = [];
  const seen = new Set<string>();

  // 1. Problems needing revision
  for (const p of progress) {
    if (p.status === 'Needs Revision') {
      const problem = problems.find((pr) => pr.id === p.problem_id);
      if (problem && !seen.has(problem.id)) {
        results.push({ problem, reason: 'You marked this for revision — revisit it to solidify your understanding.' });
        seen.add(problem.id);
      }
    }
  }

  // 2. Attempted but not solved
  for (const p of progress) {
    if (p.status === 'Attempted') {
      const problem = problems.find((pr) => pr.id === p.problem_id);
      if (problem && !seen.has(problem.id)) {
        results.push({ problem, reason: 'You started this but haven\'t solved it yet — give it another try.' });
        seen.add(problem.id);
      }
    }
  }

  // 3. Determine target difficulty based on progress
  const targetDifficulty: Difficulty =
    solvedCount.Easy >= 5 && solvedCount.Medium >= 3 ? 'Hard' :
    solvedCount.Easy >= 3 ? 'Medium' :
    preferredDifficulty;

  // 4. Unsolved problems in preferred/target difficulty, prioritizing topics the user has started
  const unsolved = problems
    .filter((p) => !seen.has(p.id) && !SOLVED_STATUSES.has(progressMap.get(p.id) || 'Not Started'))
    .sort((a, b) => {
      const da = DIFFICULTY_ORDER[a.difficulty];
      const db = DIFFICULTY_ORDER[b.difficulty];
      const targetD = DIFFICULTY_ORDER[targetDifficulty];
      const aDiff = Math.abs(da - targetD);
      const bDiff = Math.abs(db - targetD);
      if (aDiff !== bDiff) return aDiff - bDiff;
      // Prefer topics the user has started
      const aStarted = a.topic_id && solvedTopicIds.has(a.topic_id) ? 0 : 1;
      const bStarted = b.topic_id && solvedTopicIds.has(b.topic_id) ? 0 : 1;
      return aStarted - bStarted;
    });

  for (const problem of unsolved) {
    if (results.length >= limit) break;
    if (seen.has(problem.id)) continue;
    let reason: string;
    if (problem.difficulty === targetDifficulty && targetDifficulty !== preferredDifficulty) {
      reason = `You've solved ${solvedCount.Easy} easy and ${solvedCount.Medium} medium problems — ready to try a ${targetDifficulty.toLowerCase()} challenge.`;
    } else if (problem.topic_id && solvedTopicIds.has(problem.topic_id)) {
      reason = 'Continue building on a topic you\'ve already started.';
    } else {
      reason = `A ${problem.difficulty.toLowerCase()} problem to strengthen your fundamentals.`;
    }
    results.push({ problem, reason });
    seen.add(problem.id);
  }

  return results.slice(0, limit);
}
