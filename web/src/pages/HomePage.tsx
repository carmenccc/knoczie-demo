import type { IconName } from "../components/Icon.tsx";
import { Icon } from "../components/Icon.tsx";
import { LearnerMark } from "../components/LearnerMark.tsx";
import type { Destination } from "../destinations.ts";

const FEATURES: { id: Destination; label: string; icon: IconName; tone: string }[] = [
  { id: "extract", label: "Extract Vocabulary", icon: "extract", tone: "cyan" },
  { id: "dictation", label: "Dictation", icon: "dictation", tone: "yellow" },
  { id: "selection", label: "Selected Dictation", icon: "selected", tone: "lavender" },
];

type HomePageProps = {
  onNavigate: (destination: Destination) => void;
};

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="home">
      <button className="profile-entry" type="button" onClick={() => onNavigate("profile")}>
        <LearnerMark />
        <span className="profile-title">Learner Profile</span>
      </button>
      <div className="feature-row">
        {FEATURES.map((feature) => (
          <button
            key={feature.id}
            className={`feature-card ${feature.tone}`}
            type="button"
            onClick={() => onNavigate(feature.id)}
          >
            <span className="feature-icon">
              <Icon name={feature.icon} size={22} />
            </span>
            <span>{feature.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
