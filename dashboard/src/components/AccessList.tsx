import { Check, UserMinus, Users, X, Clock } from "lucide-react";

interface AccessRequest {
  id: string;
  email: string;
  name: string;
  status: string;
  avatar_url?: string;
  provider: string;
  created_at: number;
}

interface AccessListProps {
  approvedUsers: { email: string }[];
  requests: AccessRequest[];
  onRevoke: (email: string) => void;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
  activeTab: "approved" | "pending";
  onTabChange: (tab: "approved" | "pending") => void;
}

export default function AccessList({
  approvedUsers,
  requests,
  onRevoke,
  onApprove,
  onDeny,
  activeTab,
  onTabChange,
}: AccessListProps) {
  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div>
      <div className="bg-zinc-900 rounded-lg p-1 mb-6 flex gap-1">
        <button
          onClick={() => onTabChange("approved")}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md text-center transition-colors ${
            activeTab === "approved"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Approved ({approvedUsers.length})
        </button>
        <button
          onClick={() => onTabChange("pending")}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md text-center transition-colors relative ${
            activeTab === "pending"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Pending ({pendingRequests.length})
          {pendingRequests.length > 0 && activeTab !== "pending" && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "approved" && (
        <div className="space-y-2">
          {approvedUsers.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Users size={32} className="mx-auto mb-3 opacity-50" />
              <p>No approved users yet</p>
            </div>
          ) : (
            approvedUsers.map((user) => (
              <div
                key={user.email}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand/20 rounded-full flex items-center justify-center text-brand text-sm font-medium">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-zinc-300">{user.email}</span>
                </div>
                <button
                  onClick={() => onRevoke(user.email)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                >
                  <UserMinus size={12} />
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "pending" && (
        <div className="space-y-2">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-sm font-medium">
                      {(req.name || req.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-zinc-300 block">{req.name || req.email}</span>
                    {req.name && <span className="text-xs text-zinc-500">{req.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(req.id)}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <Check size={12} />
                    Approve
                  </button>
                  <button
                    onClick={() => onDeny(req.id)}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <X size={12} />
                    Deny
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
