const PAROLLA_API_URL = 'https://strapi.parolla.app/api/modes/daily';
const QUESTIONS_KEY = 'parolla-daily-questions';

export interface ParollaQuestion {
  id: number;
  question: string;
  answer: string;
  letter: { name: string };
}

const TR_ALPHABET = [
  'A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J',
  'K','L','M','N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z',
];

function sortByAlphabet(qs: ParollaQuestion[]): ParollaQuestion[] {
  return [...qs].sort((a, b) => {
    const ai = TR_ALPHABET.indexOf(a.letter.name.toLocaleUpperCase('tr-TR'));
    const bi = TR_ALPHABET.indexOf(b.letter.name.toLocaleUpperCase('tr-TR'));
    return ai - bi;
  });
}

export async function getDailyQuestions(today: string): Promise<ParollaQuestion[]> {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem(QUESTIONS_KEY);
    if (cached) {
      const { date, data } = JSON.parse(cached);
      if (date === today) return sortByAlphabet(data);
    }
  } catch { /* ignore */ }

  const res = await fetch(PAROLLA_API_URL);
  if (!res.ok) throw new Error('Parolla API error: ' + res.status);
  const data: ParollaQuestion[] = await res.json();

  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify({ date: today, data }));
  } catch { /* ignore */ }

  return sortByAlphabet(data);
}

export function checkAnswer(userInput: string, correctAnswer: string): boolean {
  const userNorm = userInput.trim().toLocaleLowerCase('tr-TR');
  if (!userNorm) return false;
  return correctAnswer
    .split(',')
    .map(a => a.trim().toLocaleLowerCase('tr-TR'))
    .some(a => a === userNorm);
}
