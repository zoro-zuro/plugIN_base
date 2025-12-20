import {
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiThumbsDown,
  FiThumbsUp,
} from "react-icons/fi";

interface MessageLog {
  _id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  feedback?: "positive" | "negative";
  responseTime?: number;
}
// ✅ Session Group Component
function SessionGroup({
  sessionId,
  messages,
  isExpanded,
  onToggle,
}: {
  sessionId: string;
  messages: MessageLog[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const startTime = messages[0]?.timestamp;
  const positiveCount = messages.filter(
    (m) => m.feedback === "positive",
  ).length;
  const negativeCount = messages.filter(
    (m) => m.feedback === "negative",
  ).length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:border-primary/30">
      {/* Session Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2 rounded-lg transition-colors ${isExpanded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          <div className="text-left">
            <div className="font-semibold text-foreground flex items-center gap-2">
              Session {sessionId.slice(-8)}
              {negativeCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-destructive" />
              )}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {sessionId}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="hidden md:flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg">
            <FiClock size={14} />
            <span>{new Date(startTime).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">
              {messages.length} msgs
            </span>

            {(positiveCount > 0 || negativeCount > 0) && (
              <div className="flex items-center gap-2 border-l border-border pl-3">
                {positiveCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
                    <FiThumbsUp size={12} /> {positiveCount}
                  </span>
                )}
                {negativeCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive text-xs font-bold bg-destructive/10 px-2 py-1 rounded">
                    <FiThumbsDown size={12} /> {negativeCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Session Messages */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 w-1/2">Message</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messages.map((msg, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide ${
                          msg.role === "user"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {msg.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground max-w-lg">
                      <div className="line-clamp-2 group-hover:line-clamp-none transition-all">
                        {msg.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                      {msg.responseTime ? (
                        <span
                          className={`${msg.responseTime > 2000 ? "text-orange-500" : "text-emerald-600"}`}
                        >
                          {msg.responseTime}ms
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {msg.feedback === "positive" && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <FiThumbsUp size={14} className="fill-current/20" />{" "}
                          Positive
                        </span>
                      )}
                      {msg.feedback === "negative" && (
                        <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                          <FiThumbsDown size={14} className="fill-current/20" />{" "}
                          Negative
                        </span>
                      )}
                      {!msg.feedback && (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionGroup;
