window.MLData = {
  SLOTS: [[50,14],[84.2,38.9],[71.2,79.1],[28.8,79.1],[15.8,38.9]],
  PSLOTS: [[77,12.8],[93.7,64.2],[50,96],[6.3,64.2],[23,12.8]],
  DISC: [
    { name: 'AI', icon: '01-ai', cap: 'Models and analysis', desc: 'Applies models to real tasks: evaluation, assistants and decision support that keep a person in the loop.', links: [2, 1] },
    { name: 'Automation', icon: '02-automation', cap: 'Turns research into tools', desc: 'Takes repetitive work off people\u2019s hands while keeping every step visible and reversible.', links: [0, 4] },
    { name: 'Research', icon: '04-research', cap: 'Evidence and validation', desc: 'Evidence gathering, adversarial review, and validation used across MaisogLabs systems.', links: [0, 4, 3] },
    { name: 'Security', icon: '03-security', cap: 'Safe, responsible use', desc: 'Keeps systems safe to run: least-privilege defaults, threat-aware design and audit trails.', links: [4, 5] },
    { name: 'Systems', icon: '05-systems', cap: 'Infrastructure and data', desc: 'Keeps software running day to day: observable parts, clear boundaries, few surprises.', links: [5, 1, 3] },
    { name: 'Architecture', icon: '08-strategy', cap: 'Structure and boundaries', desc: 'Defines how MaisogLabs systems are structured, separated, and allowed to interact.', links: [4, 3] }
  ],
  PROJ: [
    { name: 'Sentinel / DevOS', kind: 'AI operating system', status: 'Active', tags: [0, 2, 1, 5], tag: 'A research and operations system for intelligent work.', desc: 'Sentinel / DevOS is a personal AI operating system that unifies research, knowledge management, and automated workflows in a single, focused environment.' },
    { name: 'SU', kind: 'Research engine', status: '', tags: [2, 0], tag: 'A research engine that ties every claim to its source.', desc: 'SU gathers evidence, runs adversarial review, and keeps a traceable link between each conclusion and the material behind it.' },
    { name: 'ClinicFlow', kind: 'Clinic automation', status: '', tags: [1, 4, 3, 5], tag: 'Booking and workflow automation for clinics.', desc: 'ClinicFlow moves appointments, reminders and intake through one automated pipeline, with every step visible to staff.' },
    { name: 'Maisog Kilat', kind: 'Strategy validation', status: '', tags: [2, 0, 4, 5], tag: 'Strategy research, testing and validation.', desc: 'Maisog Kilat is a research environment for developing strategies and testing them against real data before they are trusted.' },
    { name: 'Maisog Guild', kind: 'Opportunity platform', status: '', tags: [4, 1], tag: 'An opportunity and quest platform.', desc: 'Maisog Guild turns opportunities into structured quests that people can discover, take on and complete.' }
  ],
  FLOW: [
    ['Research and notes come in', 'Organised into one knowledge base', 'Workflows run automatically', 'Person reviews the result'],
    ['Sources collected', 'Evidence extracted', 'Adversarial review', 'Conclusion linked to its sources'],
    ['Patient books', 'Reminders sent', 'Intake completed', 'Staff see every step'],
    ['Strategy proposed', 'Tested on real data', 'Results measured', 'Trusted or rejected'],
    ['Opportunity posted', 'Structured into a quest', 'Taken on by a person', 'Completion confirmed']
  ],
  NOTES: [
    { date: 'Mar 12, 2026', title: 'Architecture Decisions for AI Systems', desc: 'A practical framework for designing maintainable, auditable AI systems.', tags: 'Architecture · AI · Systems', cat: 'Build', img: '../../assets/plates/plate-hero-v4.png' },
    { date: 'Feb 28, 2026', title: 'From Research to Real Tools', desc: 'Notes on turning research prototypes into reliable, useful software.', tags: 'Research · Automation · Execution', cat: 'Research', img: '' },
    { date: 'Feb 10, 2026', title: 'The Role of Human Judgment', desc: 'Why human judgment remains essential in an age of increasingly capable AI systems.', tags: 'Philosophy · AI · Society', cat: 'Thoughts', img: '../../assets/plates/plate-aqueduct-v4.png' }
  ],
  EMAIL: 'maisog36@gmail.com'
};

// Motion mode, as in v10: Full | Calm | Still. prefers-reduced-motion forces Still. Override with ?motion=Calm
window.MLMotion = (function () {
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = new URLSearchParams(location.search).get('motion');
  return reduced ? 'Still' : (['Full', 'Calm', 'Still'].includes(q) ? q : 'Full');
})();
window.useNarrow = function () {
  const q = '(max-width: 699px)';
  const [n, setN] = React.useState(() => matchMedia(q).matches);
  React.useEffect(() => { const m = matchMedia(q), f = () => setN(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return n;
};
