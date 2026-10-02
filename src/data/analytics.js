export const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'physics', label: 'Physics' },
  { key: 'computer', label: 'Computer' },
  { key: 'english', label: 'English' },
];
export const PERF_GROUPS = [
  { key: 'Excellent', label: 'Excellent (75+)', color: '#15803D' },
  { key: 'Good', label: 'Good (60-74)', color: '#0E7490' },
  { key: 'Average', label: 'Average (40-59)', color: '#4338CA' },
  { key: 'Poor', label: 'Poor (below 40)', color: '#B91C1C' },
];
export function performanceGroup(overall) {
  const value = Number(overall) || 0;
  if (value >= 75) return 'Excellent';
  if (value >= 60) return 'Good';
  if (value >= 40) return 'Average';
  return 'Poor';
}
export function round1(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}
export function downsample(items, max) {
  if (items.length <= max) return items;
  const step = items.length / max;
  const out = [];
  for (let i = 0; i < max; i += 1) {
    out.push(items[Math.floor(i * step)]);
  }
  return out;
}
const EMPTY = {
  total: 0,
  avgMarks: 0,
  avgAttendance: 0,
  avgStudyHours: 0,
  passCount: 0,
  failCount: 0,
  passPct: 0,
  highestMarks: 0,
  lowestMarks: 0,
  subjectAverages: [],
  top10: [],
  gender: [],
  groups: [],
  attendance: { min: 0, max: 0, avg: 0, below75: 0 },
  batches: [],
  ageGroups: [],
  studyBuckets: [],
  scatterPass: [],
  scatterFail: [],
};
export function computeAnalytics(students) {
  const total = students.length;
  if (!total) return EMPTY;
  let sumMarks = 0;
  let sumAttendance = 0;
  let sumStudyHours = 0;
  let passCount = 0;
  let highestMarks = 0;
  let lowestMarks = 100;
  let minAtt = 100;
  let maxAtt = 0;
  let below75 = 0;
  const subjSum = { mathematics: 0, physics: 0, computer: 0, english: 0 };
  const genderAcc = {
    Male: { count: 0, sum: 0, pass: 0, att: 0 },
    Female: { count: 0, sum: 0, pass: 0, att: 0 },
  };
  const groupAcc = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
  const ageAcc = {};
  const bucketDefs = [
    { label: '1-2 hrs', min: 0, max: 3 },
    { label: '3-4 hrs', min: 3, max: 5 },
    { label: '5-6 hrs', min: 5, max: 7 },
    { label: '7-8 hrs', min: 7, max: 100 },
  ];
  const bucketAcc = bucketDefs.map(() => ({ count: 0, sum: 0 }));
  const scatterPass = [];
  const scatterFail = [];
  for (let i = 0; i < total; i += 1) {
    const s = students[i];
    const marks = Number(s.overallMarks) || 0;
    const att = Number(s.attendance) || 0;
    const sh = Number(s.studyHours) || 0;
    sumMarks += marks;
    sumAttendance += att;
    sumStudyHours += sh;
    if (marks > highestMarks) highestMarks = marks;
    if (marks < lowestMarks) lowestMarks = marks;
    if (att < minAtt) minAtt = att;
    if (att > maxAtt) maxAtt = att;
    if (att < 75) below75 += 1;
    subjSum.mathematics += Number(s.mathematics) || 0;
    subjSum.physics += Number(s.physics) || 0;
    subjSum.computer += Number(s.computer) || 0;
    subjSum.english += Number(s.english) || 0;
    const isPass = s.result === 'Pass';
    if (isPass) passCount += 1;
    const g = s.gender === 'Female' ? 'Female' : 'Male';
    genderAcc[g].count += 1;
    genderAcc[g].sum += marks;
    genderAcc[g].att += att;
    if (isPass) genderAcc[g].pass += 1;
    groupAcc[performanceGroup(marks)] += 1;
    const age = Number(s.age) || 0;
    if (!ageAcc[age]) ageAcc[age] = { count: 0, sum: 0 };
    ageAcc[age].count += 1;
    ageAcc[age].sum += marks;
    for (let b = 0; b < bucketDefs.length; b += 1) {
      if (sh >= bucketDefs[b].min && sh < bucketDefs[b].max) {
        bucketAcc[b].count += 1;
        bucketAcc[b].sum += marks;
        break;
      }
    }
    const point = { x: att, y: marks };
    if (isPass) scatterPass.push(point);
    else scatterFail.push(point);
  }
  const subjectAverages = SUBJECTS.map((s) => ({
    key: s.key,
    label: s.label,
    avg: round1(subjSum[s.key] / total),
  }));
  const sortedByMarks = students
    .slice()
    .sort((a, b) => (Number(b.overallMarks) || 0) - (Number(a.overallMarks) || 0));
  const top10 = sortedByMarks.slice(0, 10);
  const gender = ['Male', 'Female'].map((g) => {
    const acc = genderAcc[g];
    return {
      gender: g,
      count: acc.count,
      avgMarks: acc.count ? round1(acc.sum / acc.count) : 0,
      avgAttendance: acc.count ? round1(acc.att / acc.count) : 0,
      passPct: acc.count ? round1((acc.pass / acc.count) * 100) : 0,
    };
  });
  const groups = PERF_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    color: g.color,
    count: groupAcc[g.key],
    pct: round1((groupAcc[g.key] / total) * 100),
  }));
  const sortedById = students
    .slice()
    .sort((a, b) => String(a.studentId).localeCompare(String(b.studentId)));
  const chunkSize = total > 4000 ? Math.ceil(total / 40) : 100;
  const batches = [];
  for (let i = 0; i < sortedById.length; i += chunkSize) {
    const chunk = sortedById.slice(i, i + chunkSize);
    const sum = chunk.reduce((acc, s) => acc + (Number(s.overallMarks) || 0), 0);
    batches.push({
      label: String(i + 1) + '-' + String(Math.min(i + chunkSize, sortedById.length)),
      count: chunk.length,
      avg: round1(sum / chunk.length),
    });
  }
  const ageGroups = Object.keys(ageAcc)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map((age) => ({
      age,
      count: ageAcc[age].count,
      avg: round1(ageAcc[age].sum / ageAcc[age].count),
    }));
  const studyBuckets = bucketDefs.map((d, i) => ({
    label: d.label,
    count: bucketAcc[i].count,
    avg: bucketAcc[i].count ? round1(bucketAcc[i].sum / bucketAcc[i].count) : 0,
  }));
  return {
    total,
    avgMarks: round1(sumMarks / total),
    avgAttendance: round1(sumAttendance / total),
    avgStudyHours: round1(sumStudyHours / total),
    passCount,
    failCount: total - passCount,
    passPct: round1((passCount / total) * 100),
    highestMarks: round1(highestMarks),
    lowestMarks: round1(lowestMarks),
    subjectAverages,
    top10,
    gender,
    groups,
    attendance: {
      min: minAtt,
      max: maxAtt,
      avg: round1(sumAttendance / total),
      below75,
    },
    batches,
    ageGroups,
    studyBuckets,
    scatterPass: downsample(scatterPass, 400),
    scatterFail: downsample(scatterFail, 200),
  };
}
export function buildInsightContext(a) {
  const lines = [];
  lines.push('Total students: ' + a.total);
  lines.push('Average overall marks: ' + a.avgMarks);
  lines.push('Average attendance: ' + a.avgAttendance + ' percent');
  lines.push('Average study hours per day: ' + a.avgStudyHours);
  lines.push('Pass percentage: ' + a.passPct + ' percent (' + a.passCount + ' pass, ' + a.failCount + ' fail)');
  lines.push('Highest overall marks: ' + a.highestMarks + ', lowest overall marks: ' + a.lowestMarks);
  lines.push(
    'Subject averages: ' + a.subjectAverages.map((s) => s.label + ' ' + s.avg).join(', ')
  );
  lines.push(
    'Gender comparison: ' +
      a.gender
        .map(
          (g) =>
            g.gender + ' count ' + g.count + ', avg marks ' + g.avgMarks + ', pass ' + g.passPct + ' percent'
        )
        .join(' | ')
  );
  lines.push(
    'Performance groups: ' + a.groups.map((g) => g.label + ' ' + g.count + ' students (' + g.pct + ' percent)').join(', ')
  );
  lines.push(
    'Attendance stats: minimum ' +
      a.attendance.min +
      ', maximum ' +
      a.attendance.max +
      ', average ' +
      a.attendance.avg +
      ', students below 75 percent: ' +
      a.attendance.below75
  );
  lines.push(
    'Study hour ranges: ' + a.studyBuckets.map((b) => b.label + ' -> ' + b.count + ' students, avg marks ' + b.avg).join(', ')
  );
  lines.push(
    'Age group averages: ' + a.ageGroups.map((g) => g.age + ' yrs avg ' + g.avg + ' (' + g.count + ')').join(', ')
  );
  lines.push(
    'Top students: ' +
      a.top10.slice(0, 5).map((s, i) => String(i + 1) + '. ' + s.name + ' (' + s.studentId + ') ' + s.overallMarks).join(', ')
  );
  return lines.join('\n');
}