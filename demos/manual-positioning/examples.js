export const EXAMPLES = [
  {
    id: 'assembly-line',
    title: 'Assembly line overview',
    description:
      'Manual coordinates stagger the intake, build, and QA steps to mimic the real conveyor belt spacing.',
    before: `flowchart LR\n  Intake --> Build --> QA --> Ship`,
    after: `flowchart LR\n  Intake@{ position: "0 40" }\n  Build@{ position: [140, 0] }\n  QA@{ position: [280, 60] }\n  Ship@{ position: "420 20" }\n  Intake --> Build --> QA --> Ship`,
  },
  {
    id: 'decision-diamond',
    title: 'Decision diamond',
    description:
      'The decision and outcomes form a diamond layout by nudging the approve/deny nodes around the decision.',
    before: `flowchart TB\n  Start --> Decision\n  Decision -->|Approve| Approve\n  Decision -->|Deny| Deny\n  Approve --> Archive\n  Deny --> Rework`,
    after: `flowchart TB\n  Start@{ position: "200 0" }\n  Decision@{ position: [200, 80] }\n  Approve@{ position: [320, 160] }\n  Deny@{ position: [80, 160] }\n  Archive@{ position: [320, 240] }\n  Rework@{ position: [80, 240] }\n  Start --> Decision\n  Decision -->|Approve| Approve\n  Decision -->|Deny| Deny\n  Approve --> Archive\n  Deny --> Rework`,
  },
  {
    id: 'swimlane-hand-off',
    title: 'Swimlane hand-off',
    description:
      'Nodes are aligned into product, design, and engineering columns by setting X coordinates while keeping the flow intact.',
    before: `flowchart TB\n  Concept --> Wireframe --> Prototype --> Launch`,
    after: `flowchart TB\n  Concept@{ position: "0, 0" }\n  Wireframe@{ position: "200, 0" }\n  Prototype@{ position: "400, 0" }\n  Launch@{ position: "600, 0" }\n  Research@{ position: "0, 120" }\n  Review@{ position: "200, 120" }\n  Test@{ position: "400, 120" }\n  Measure@{ position: "600, 120" }\n  Concept --> Wireframe --> Prototype --> Launch\n  Concept --> Research\n  Wireframe --> Review\n  Prototype --> Test\n  Launch --> Measure`,
  },
  {
    id: 'support-escalation',
    title: 'Support escalation map',
    description:
      'Manual positions create a left-to-right escalation ladder with callbacks placed underneath their owners.',
    before: `flowchart LR\n  Tier1 --> Tier2 --> Tier3\n  Tier1 --> KB\n  Tier2 --> Vendor\n  Tier3 --> Report`,
    after: `flowchart LR\n  Tier1@{ position: "0 0" }\n  Tier2@{ position: [180, 0] }\n  Tier3@{ position: [360, 0] }\n  KB@{ position: "0 120" }\n  Vendor@{ position: [180, 120] }\n  Report@{ position: [360, 120] }\n  Tier1 --> Tier2 --> Tier3\n  Tier1 --> KB\n  Tier2 --> Vendor\n  Tier3 --> Report`,
  },
  {
    id: 'release-train',
    title: 'Release train timeline',
    description:
      'A quarterly release train is plotted across a calendar-like grid so stakeholders can follow dates at a glance.',
    before: `flowchart LR\n  Plan --> Build --> Integrate --> Release\n  Plan --> Retro\n  Build --> Demo\n  Integrate --> Hardening\n  Release --> Celebrate`,
    after: `flowchart LR\n  Plan@{ position: "0 0" }\n  Build@{ position: "160 0" }\n  Integrate@{ position: "320 0" }\n  Release@{ position: "480 0" }\n  Retro@{ position: "0 120" }\n  Demo@{ position: "160 120" }\n  Hardening@{ position: "320 120" }\n  Celebrate@{ position: "480 120" }\n  Plan --> Build --> Integrate --> Release\n  Plan --> Retro\n  Build --> Demo\n  Integrate --> Hardening\n  Release --> Celebrate`,
  },
  {
    id: 'subgraph-layout',
    title: 'Data center rooms',
    description:
      'Two rooms stay grouped while rack nodes are arranged manually inside each subgraph.',
    before: `flowchart LR\n  subgraph RoomA\n    A1 --> A2 --> A3\n  end\n  subgraph RoomB\n    B1 --> B2 --> B3\n  end\n  A3 --> B1`,
    after: `flowchart LR\n  subgraph RoomA\n    direction LR\n    A1@{ position: "0 40" }\n    A2@{ position: [120, 40] }\n    A3@{ position: [240, 40] }\n    A1 --> A2 --> A3\n  end\n  subgraph RoomB\n    direction LR\n    B1@{ position: [420, 40] }\n    B2@{ position: [540, 40] }\n    B3@{ position: [660, 40] }\n    B1 --> B2 --> B3\n  end\n  A3 --> B1`,
  },
  {
    id: 'feedback-loop',
    title: 'Feedback loop highlight',
    description:
      'Feedback and iteration nodes wrap around the main cycle by curving them beneath the default layout.',
    before: `flowchart TD\n  Idea --> Build --> Launch --> Monitor --> Improve --> Idea`,
    after: `flowchart TD\n  Idea@{ position: "200 0" }\n  Build@{ position: "200 120" }\n  Launch@{ position: "200 240" }\n  Monitor@{ position: "200 360" }\n  Improve@{ position: [60, 360] }\n  Idea --> Build --> Launch --> Monitor\n  Monitor --> Improve\n  Improve --> Idea`,
  },
  {
    id: 'service-blueprint',
    title: 'Service blueprint snapshot',
    description:
      'Front stage, backstage, and systems swimlanes become a tidy matrix with coordinates.',
    before: `flowchart TB\n  Customer --> Agent --> System\n  Customer --> SelfService\n  Agent --> Knowledge\n  System --> Logs`,
    after: `flowchart TB\n  Customer@{ position: "0 0" }\n  Agent@{ position: [240, 0] }\n  System@{ position: [480, 0] }\n  SelfService@{ position: "0 160" }\n  Knowledge@{ position: [240, 160] }\n  Logs@{ position: [480, 160] }\n  Customer --> Agent --> System\n  Customer --> SelfService\n  Agent --> Knowledge\n  System --> Logs`,
  },
];

export const LAYOUT_OPTIONS = [
  {
    value: 'dagre',
    label: 'Dagre (layered)',
    description: 'The default layered solver keeps directional graphs tidy with even spacing.',
  },
  {
    value: 'cose-bilkent',
    label: 'fCoSE (force-directed)',
    description:
      'Force-directed placement from Cytoscape spreads nodes naturally while respecting manual coordinates.',
  },
  {
    value: 'elk',
    label: 'ELK layered',
    description:
      "ELK's layered engine focuses on clear orthogonal routing and balanced layers for dense diagrams.",
  },
  {
    value: 'elk.force',
    label: 'ELK force',
    description:
      'A physics-inspired ELK layout that pairs well with manual tweaks for organic storyboards.',
  },
];
