'use client';

import { Shield, CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';
import type { AppUser } from '@/lib/userTypes';

interface UserManagerProps {
  users: AppUser[];
  disabled?: boolean;
}

export default function UserManager({
  users,
  disabled = false,
}: UserManagerProps) {
  const activeUser = users.find((user) => user.isActive) || users[0] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">User Tunggal</h3>
            <p className="text-xs text-slate-400 mt-1">
              Data user hanya berasal dari file database/user-generator.json.
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        {activeUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                {activeUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {activeUser.fullName}
                </p>
                <p className="text-xs text-slate-400 font-mono truncate">
                  {activeUser.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>User aktif dari file generator.</span>
            </div>

            <p className="text-xs text-slate-500">
              Jika ingin mengganti user, edit file generator lalu jalankan seed ulang.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Belum ada user. Isi database/user-generator.json terlebih dahulu.</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Daftar User</h3>
        </div>

        {users.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">Belum ada user</p>
            <p className="text-xs text-slate-300 mt-1">
              Isi dulu file generator atau tambahkan manual di atas
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {users.map((user) => (
              <li key={user.id} className="px-5 py-3.5 flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    user.isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-700">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {user.username}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}