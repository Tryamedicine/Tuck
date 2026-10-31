export function greetingAt(date = new Date()) {
  const hour = date.getHours();
  return hour >= 5 && hour < 12 ? 'Good morning' : hour >= 12 && hour < 18 ? 'Good afternoon' : 'Good evening';
}
export function countPhrase(count) {
  return count === 0 ? 'Free as a bird.' : count === 1 ? 'One thing at a time.' : `${count} things to do`;
}
export function greetingFor(name, date = new Date()) {
  const clean = String(name || '').trim();
  return greetingAt(date) + (clean ? `, ${clean}` : '');
}

export function moodForCount(count){return count===0?'free':count<=3?'easy':count<=7?'focused':count<=10?'attentive':'busy'}
