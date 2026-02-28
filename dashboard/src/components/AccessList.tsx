import { UserMinus, Users } from "lucide-react";

interface AccessListProps {
  approvedUsers: { email: string }[];
  onRevoke: (email: string) => void;
}

export default function AccessList({
  approvedUsers,
  onRevoke,
}: AccessListProps) {
  return (
    <div>
      <div className="bg-zinc-900 rounded-lg p-1 mb-6">
        <div className="py-2 px-4 text-sm font-medium rounded-md bg-zinc-800 text-zinc-100 text-center">
          Access List ({approvedUsers.length})
        </div>
      </div>

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
    </div>
  );
}
