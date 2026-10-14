import type { IconName } from "./Icon.tsx";
import { Icon } from "./Icon.tsx";
import type { Destination } from "../destinations.ts";

export type TaskTab = {
  id: Destination;
  label: string;
  icon: IconName;
};

type SidebarProps = {
  destination: Destination;
  collapsed: boolean;
  tasks: TaskTab[];
  onNavigate: (destination: Destination) => void;
  onToggleCollapsed: () => void;
};

export function Sidebar({ destination, collapsed, tasks, onNavigate, onToggleCollapsed }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="side-top">
        <button className="brand" type="button" onClick={() => onNavigate("home")}>
          <span className="brand-mark">
            <Icon name="spark" size={16} />
          </span>
          <span className="brand-name">Knoczie</span>
        </button>
        <button
          className="collapse-control"
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          <Icon name={collapsed ? "expand" : "collapse"} size={18} />
        </button>
      </div>
      <button
        className={`icon-tab ${destination === "home" ? "active" : ""}`}
        type="button"
        aria-label="Home"
        aria-current={destination === "home" ? "page" : undefined}
        data-label="Home"
        onClick={() => onNavigate("home")}
      >
        <Icon name="home" />
      </button>
      {tasks.length > 0 ? (
        <div className="task-list">
          {tasks.map((task) => {
            const active = destination === task.id;
            return (
              <button
                key={task.id}
                className={`task-tab ${active ? "active" : ""}`}
                type="button"
                aria-current={active ? "page" : undefined}
                data-label={task.label}
                onClick={() => onNavigate(task.id)}
              >
                <Icon name={task.icon} />
                <span>{task.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <button
        className={`icon-tab settings-button ${destination === "settings" ? "active" : ""}`}
        type="button"
        aria-label="Settings"
        aria-current={destination === "settings" ? "page" : undefined}
        data-label="Settings"
        onClick={() => onNavigate("settings")}
      >
        <Icon name="settings" />
      </button>
    </aside>
  );
}
