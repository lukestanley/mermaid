export interface ExampleDefinition {
  id: string;
  title: string;
  description: string;
  before: string;
  after: string;
}

export const EXAMPLES: ExampleDefinition[] = [
  {
    id: 'assembly-line',
    title: 'Assembly line overview',
    description:
      'Manual coordinates stagger the intake, build, and QA steps to mimic the real conveyor belt spacing.',
    before: `flowchart LR
  Intake --> Build --> QA --> Ship`,
    after: `flowchart LR
  Intake@{ position: "0 40" }
  Build@{ position: [140, 0] }
  QA@{ position: [280, 60] }
  Ship@{ position: "420 20" }
  Intake --> Build --> QA --> Ship`,
  },
  {
    id: 'decision-diamond',
    title: 'Decision diamond',
    description:
      'The decision and outcomes form a diamond layout by nudging the approve/deny nodes around the decision.',
    before: `flowchart TB
  Start --> Decision
  Decision -->|Approve| Approve
  Decision -->|Deny| Deny
  Approve --> Archive
  Deny --> Rework`,
    after: `flowchart TB
  Start@{ position: "200 0" }
  Decision@{ position: [200, 80] }
  Approve@{ position: [320, 160] }
  Deny@{ position: [80, 160] }
  Archive@{ position: [320, 240] }
  Rework@{ position: [80, 240] }
  Start --> Decision
  Decision -->|Approve| Approve
  Decision -->|Deny| Deny
  Approve --> Archive
  Deny --> Rework`,
  },
  {
    id: 'swimlane-hand-off',
    title: 'Swimlane hand-off',
    description:
      'Nodes are aligned into product, design, and engineering columns by setting X coordinates while keeping the flow intact.',
    before: `flowchart TB
  Concept --> Wireframe --> Prototype --> Launch`,
    after: `flowchart TB
  Concept@{ position: "0, 0" }
  Wireframe@{ position: "200, 0" }
  Prototype@{ position: "400, 0" }
  Launch@{ position: "600, 0" }
  Research@{ position: "0, 120" }
  Review@{ position: "200, 120" }
  Test@{ position: "400, 120" }
  Measure@{ position: "600, 120" }
  Concept --> Wireframe --> Prototype --> Launch
  Concept --> Research
  Wireframe --> Review
  Prototype --> Test
  Launch --> Measure`,
  },
  {
    id: 'support-escalation',
    title: 'Support escalation map',
    description:
      'Manual positions create a left-to-right escalation ladder with callbacks placed underneath their owners.',
    before: `flowchart LR
  Tier1 --> Tier2 --> Tier3
  Tier1 --> KB
  Tier2 --> Vendor
  Tier3 --> Report`,
    after: `flowchart LR
  Tier1@{ position: "0 0" }
  Tier2@{ position: [180, 0] }
  Tier3@{ position: [360, 0] }
  KB@{ position: "0 120" }
  Vendor@{ position: [180, 120] }
  Report@{ position: [360, 120] }
  Tier1 --> Tier2 --> Tier3
  Tier1 --> KB
  Tier2 --> Vendor
  Tier3 --> Report`,
  },
  {
    id: 'release-train',
    title: 'Release train timeline',
    description:
      'A quarterly release train is plotted across a calendar-like grid so stakeholders can follow dates at a glance.',
    before: `flowchart LR
  Plan --> Build --> Integrate --> Release
  Plan --> Retro
  Build --> Demo
  Integrate --> Hardening
  Release --> Celebrate`,
    after: `flowchart LR
  Plan@{ position: "0 0" }
  Build@{ position: "160 0" }
  Integrate@{ position: "320 0" }
  Release@{ position: "480 0" }
  Retro@{ position: "0 120" }
  Demo@{ position: "160 120" }
  Hardening@{ position: "320 120" }
  Celebrate@{ position: "480 120" }
  Plan --> Build --> Integrate --> Release
  Plan --> Retro
  Build --> Demo
  Integrate --> Hardening
  Release --> Celebrate`,
  },
  {
    id: 'subgraph-layout',
    title: 'Data center rooms',
    description:
      'Two rooms stay grouped while rack nodes are arranged manually inside each subgraph.',
    before: `flowchart LR
  subgraph RoomA
    A1 --> A2 --> A3
  end
  subgraph RoomB
    B1 --> B2 --> B3
  end
  A3 --> B1`,
    after: `flowchart LR
  subgraph RoomA
    direction LR
    A1@{ position: "0 40" }
    A2@{ position: [120, 40] }
    A3@{ position: [240, 40] }
    A1 --> A2 --> A3
  end
  subgraph RoomB
    direction LR
    B1@{ position: [420, 40] }
    B2@{ position: [540, 40] }
    B3@{ position: [660, 40] }
    B1 --> B2 --> B3
  end
  A3 --> B1`,
  },
  {
    id: 'feedback-loop',
    title: 'Feedback loop highlight',
    description:
      'Feedback and iteration nodes wrap around the main cycle by curving them beneath the default layout.',
    before: `flowchart TD
  Idea --> Build --> Launch --> Monitor --> Improve --> Idea`,
    after: `flowchart TD
  Idea@{ position: "200 0" }
  Build@{ position: "200 120" }
  Launch@{ position: "200 240" }
  Monitor@{ position: "200 360" }
  Improve@{ position: [60, 360] }
  Idea --> Build --> Launch --> Monitor
  Monitor --> Improve
  Improve --> Idea`,
  },
  {
    id: 'service-blueprint',
    title: 'Service blueprint snapshot',
    description:
      'Front stage, back office, and system swimlanes become a tidy matrix driven solely by manual coordinates.',
    before: `flowchart TB
  Customer --> Agent --> System
  Customer --> SelfService
  Agent --> Knowledge
  System --> Logs`,
    after: `flowchart TB
  Customer@{ position: "0 0" }
  Agent@{ position: [240, 0] }
  System@{ position: [480, 0] }
  SelfService@{ position: "0 160" }
  Knowledge@{ position: [240, 160] }
  Logs@{ position: [480, 160] }
  Customer --> Agent --> System
  Customer --> SelfService
  Agent --> Knowledge
  System --> Logs`,
  },
];
