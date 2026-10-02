const MALE_FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Rohan', 'Kabir', 'Dhruv', 'Yash', 'Aryan', 'Karthik', 'Nikhil', 'Rahul', 'Siddharth', 'Manish',
  'Pranav', 'Harsh', 'Tejas', 'Varun', 'Omkar', 'Suresh', 'Rajat', 'Abhinav', 'Gaurav', 'Nitin',
];
const FEMALE_FIRST = [
  'Aanya', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Myra', 'Riya', 'Ishita', 'Kavya',
  'Meera', 'Sneha', 'Nisha', 'Priya', 'Shreya', 'Tanvi', 'Anjali', 'Pooja', 'Divya', 'Swara',
  'Rhea', 'Neha', 'Lakshmi', 'Sanjana', 'Bhavya', 'Charvi', 'Gayatri', 'Jyoti', 'Komal', 'Mitali',
];
const LAST = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Desai', 'Joshi', 'Kulkarni', 'Mehta',
  'Gupta', 'Chauhan', 'Pillai', 'Rao', 'Shetty', 'Banerjee', 'Chatterjee', 'Mishra', 'Pandey', 'Bhat',
  'Deshmukh', 'Naik', 'Shah', 'Thakur', 'Yadav', 'Kapoor', 'Malhotra', 'Sinha', 'Dubey', 'Agarwal',
];
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rnd) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
export function computeOverall(mathematics, physics, computer, english) {
  const avg = (Number(mathematics) + Number(physics) + Number(computer) + Number(english)) / 4;
  return Math.round(avg * 10) / 10;
}
export function computeResult(mathematics, physics, computer, english, overall) {
  const lowest = Math.min(Number(mathematics), Number(physics), Number(computer), Number(english));
  const avg = typeof overall === 'number' ? overall : computeOverall(mathematics, physics, computer, english);
  return avg >= 40 && lowest >= 35 ? 'Pass' : 'Fail';
}
export function generateStudents(count = 1000, seed = 20260114) {
  const rnd = mulberry32(seed);
  const rows = [];
  for (let i = 1; i <= count; i += 1) {
    const isMale = rnd() < 0.5;
    const pool = isMale ? MALE_FIRST : FEMALE_FIRST;
    const first = pool[Math.floor(rnd() * pool.length)];
    const last = LAST[Math.floor(rnd() * LAST.length)];
    const attendance = Math.round(50 + rnd() * 50);
    const studyHours = Math.round((1 + rnd() * 7) * 10) / 10;
    const age = 18 + Math.floor(rnd() * 5);
    const base = 27 + ((attendance - 50) / 50) * 34 + ((studyHours - 1) / 7) * 24;
    const ability = gauss(rnd) * 6;
    const mark = (offset) => Math.round(clamp(base + ability + gauss(rnd) * 7 + offset, 0, 100));
    const mathematics = mark(-2);
    const physics = mark(-1);
    const computer = mark(3);
    const english = mark(1);
    const overallMarks = computeOverall(mathematics, physics, computer, english);
    const result = computeResult(mathematics, physics, computer, english, overallMarks);
    rows.push({
      id: 'gen-' + i,
      studentId: 'STU' + String(i).padStart(4, '0'),
      name: first + ' ' + last,
      gender: isMale ? 'Male' : 'Female',
      age,
      attendance,
      studyHours,
      mathematics,
      physics,
      computer,
      english,
      overallMarks,
      result,
      source: 'generated',
    });
  }
  return rows;
}
export function normalizeStudent(raw) {
  const mathematics = clamp(Math.round(Number(raw.mathematics) || 0), 0, 100);
  const physics = clamp(Math.round(Number(raw.physics) || 0), 0, 100);
  const computer = clamp(Math.round(Number(raw.computer) || 0), 0, 100);
  const english = clamp(Math.round(Number(raw.english) || 0), 0, 100);
  const overallMarks = computeOverall(mathematics, physics, computer, english);
  return {
    id: String(raw.id ?? raw._id ?? raw.studentId ?? ''),
    studentId: String(raw.studentId ?? '').trim(),
    name: String(raw.name ?? '').trim(),
    gender: raw.gender === 'Female' ? 'Female' : 'Male',
    age: clamp(Math.round(Number(raw.age) || 20), 15, 60),
    attendance: clamp(Math.round(Number(raw.attendance) || 0), 0, 100),
    studyHours: clamp(Math.round((Number(raw.studyHours) || 0) * 10) / 10, 0, 12),
    mathematics,
    physics,
    computer,
    english,
    overallMarks,
    result: computeResult(mathematics, physics, computer, english, overallMarks),
    source: raw.source || 'saved',
  };
}

export function generateCohortPreset(type = 'default', count = 500) {
  const seed = type === 'high_performers' ? 428910 : type === 'at_risk' ? 918234 : 20260114;
  const rnd = mulberry32(seed);
  const rows = [];

  for (let i = 1; i <= count; i += 1) {
    const isMale = rnd() < 0.5;
    const pool = isMale ? MALE_FIRST : FEMALE_FIRST;
    const first = pool[Math.floor(rnd() * pool.length)];
    const last = LAST[Math.floor(rnd() * LAST.length)];

    let attendance, studyHours, baseMark;
    if (type === 'high_performers') {
      attendance = Math.round(82 + rnd() * 18);
      studyHours = Math.round((5 + rnd() * 5) * 10) / 10;
      baseMark = 75 + rnd() * 18;
    } else if (type === 'at_risk') {
      attendance = Math.round(35 + rnd() * 38);
      studyHours = Math.round((0.5 + rnd() * 2.5) * 10) / 10;
      baseMark = 24 + rnd() * 22;
    } else {
      attendance = Math.round(50 + rnd() * 50);
      studyHours = Math.round((1 + rnd() * 7) * 10) / 10;
      baseMark = 27 + ((attendance - 50) / 50) * 34 + ((studyHours - 1) / 7) * 24;
    }

    const age = 18 + Math.floor(rnd() * 5);
    const ability = gauss(rnd) * 5;
    const mark = (offset) => Math.round(clamp(baseMark + ability + gauss(rnd) * 5 + offset, 0, 100));

    const mathematics = mark(type === 'high_performers' ? 2 : -2);
    const physics = mark(0);
    const computer = mark(type === 'high_performers' ? 4 : 2);
    const english = mark(1);
    const overallMarks = computeOverall(mathematics, physics, computer, english);
    const result = computeResult(mathematics, physics, computer, english, overallMarks);

    const prefix = type === 'high_performers' ? 'HON' : type === 'at_risk' ? 'RSK' : 'PRD';
    rows.push({
      id: `${prefix.toLowerCase()}-${i}`,
      studentId: `${prefix}${String(i).padStart(4, '0')}`,
      name: `${first} ${last}`,
      gender: isMale ? 'Male' : 'Female',
      age,
      attendance,
      studyHours,
      mathematics,
      physics,
      computer,
      english,
      overallMarks,
      result,
      source: 'preset',
    });
  }
  return rows;
}