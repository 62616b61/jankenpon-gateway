/*
 * 0 - rock
 * 1 - paper
 * 2 - scissors
 */

const WIN_SCORE_COND = 99999
const pick = () => Math.floor(Math.random() * 3)

const score = [0, 0]
const rules = [2, 0, 1]
const name = ['rock', 'paper', 'scissors']

while (
  score[0] < WIN_SCORE_COND &&
  score[1] < WIN_SCORE_COND
) {
  const p0 = pick()
  const p1 = pick()

  if (p0 === p1) continue
  else if (rules[p0] === p1) score[0]++
  else score[1]++
}

const winner = score[0] > score[1] ? 0 : 1

console.log('winner: player', winner)
console.log('score:', score)
