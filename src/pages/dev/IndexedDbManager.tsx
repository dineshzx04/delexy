import React, { useState, useEffect } from 'react';
import {
  Button as AntButton,
  Tag as AntTag,
  Popconfirm as AntPopconfirm,
  Card as AntCard,
  Spin,
  App as AntApp
} from 'antd';
import * as Lucide from 'lucide-react';
import { userDb } from '../../data/user';
import { businessDb } from '../../data/business';
import { catalogDb } from '../../data/catalog';
import { seedDatabase } from '../../data/seed';

export interface IDBInfo {
  name: string;
  version: number;
}

export interface StorageItem {
  key: string;
  value: string;
  size: string;
}

const IndexedDbManager: React.FC = () => {
  const { message: antMessage } = AntApp.useApp();
  const [databases, setDatabases] = useState<IDBInfo[]>([]);
  const [localStorageItems, setLocalStorageItems] = useState<StorageItem[]>([]);
  const [sessionStorageItems, setSessionStorageItems] = useState<StorageItem[]>([]);
  const [cookieItems, setCookieItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all IndexedDB, LocalStorage, SessionStorage, and Cookie items
  const fetchAllStorageData = async () => {
    try {
      setLoading(true);

      // 1. Get IndexedDB databases
      if (window.indexedDB && window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        const formatted: IDBInfo[] = dbs
          .filter((d) => Boolean(d.name))
          .map((d) => ({
            name: d.name || 'Unknown',
            version: d.version || 1,
          }));
        setDatabases(formatted);
      } else {
        setDatabases([{ name: userDb.name, version: userDb.verno }]);
      }

      // 2. Read LocalStorage items
      const lsItems: StorageItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          lsItems.push({
            key,
            value: val.length > 60 ? `${val.substring(0, 60)}...` : val,
            size: `${(new Blob([val]).size / 1024).toFixed(2)} KB`,
          });
        }
      }
      setLocalStorageItems(lsItems);

      // 3. Read SessionStorage items
      const ssItems: StorageItem[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const val = sessionStorage.getItem(key) || '';
          ssItems.push({
            key,
            value: val.length > 60 ? `${val.substring(0, 60)}...` : val,
            size: `${(new Blob([val]).size / 1024).toFixed(2)} KB`,
          });
        }
      }
      setSessionStorageItems(ssItems);

      // 4. Read Browser Cookies
      const cookiesList: StorageItem[] = [];
      if (document.cookie) {
        const pairs = document.cookie.split(';');
        pairs.forEach((pair) => {
          const parts = pair.trim().split('=');
          const key = parts[0] || '';
          const val = parts.slice(1).join('=') || '';
          if (key) {
            cookiesList.push({
              key,
              value: val.length > 60 ? `${val.substring(0, 60)}...` : val,
              size: `${(new Blob([val]).size / 1024).toFixed(2)} KB`,
            });
          }
        });
      }
      setCookieItems(cookiesList);
    } catch (err) {
      console.error('Error fetching storage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStorageData();
  }, []);

  // Delete a specific database by name using window.indexedDB.deleteDatabase(name)
  const handleDeleteDatabase = async (dbName: string) => {
    try {
      setLoading(true);

      if (userDb.name === dbName && userDb.isOpen()) {
        try {
          userDb.close();
        } catch (e) {
          console.warn('Closing Dexie database:', e);
        }
      }

      await new Promise<void>((resolve, reject) => {
        const req = window.indexedDB.deleteDatabase(dbName);

        req.onsuccess = () => {
          antMessage.success(`Deleted IndexedDB database: '${dbName}'`);
          resolve();
        };

        req.onerror = (evt) => {
          const err = (evt.target as any)?.error || new Error('Delete failed');
          console.error('Delete database error:', err);
          antMessage.error(`Failed to delete database '${dbName}'`);
          reject(err);
        };

        req.onblocked = () => {
          antMessage.warning(`Delete of '${dbName}' is blocked. Please close other open tabs using this database.`);
          resolve();
        };
      });

      await fetchAllStorageData();
    } catch (err: any) {
      console.error('Failed to delete database:', err);
    } finally {
      setLoading(false);
    }
  };

  // LocalStorage Actions
  const handleDeleteLocalStorageKey = (key: string) => {
    localStorage.removeItem(key);
    antMessage.success(`Removed '${key}' from LocalStorage.`);
    fetchAllStorageData();
  };

  const handleClearLocalStorage = () => {
    localStorage.clear();
    antMessage.success('Cleared all LocalStorage items.');
    fetchAllStorageData();
  };

  // SessionStorage Actions
  const handleDeleteSessionStorageKey = (key: string) => {
    sessionStorage.removeItem(key);
    antMessage.success(`Removed '${key}' from SessionStorage.`);
    fetchAllStorageData();
  };

  const handleClearSessionStorage = () => {
    sessionStorage.clear();
    antMessage.success('Cleared all SessionStorage items.');
    fetchAllStorageData();
  };

  // Cookie Actions
  const handleDeleteCookie = (key: string) => {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${window.location.pathname};`;
    antMessage.success(`Deleted cookie '${key}'.`);
    fetchAllStorageData();
  };

  const handleClearAllCookies = () => {
    if (document.cookie) {
      const pairs = document.cookie.split(';');
      pairs.forEach((pair) => {
        const key = pair.trim().split('=')[0];
        if (key) {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${window.location.pathname};`;
        }
      });
    }
    antMessage.success('Cleared all cookies.');
    fetchAllStorageData();
  };

  // Re-seed active database
  const handleReSeed = async () => {
    try {
      setLoading(true);
      if (!userDb.isOpen()) {
        await userDb.open();
      }
      for (const t of userDb.tables) {
        await t.clear();
      }
      if (!businessDb.isOpen()) {
        await businessDb.open();
      }
      for (const t of businessDb.tables) {
        await t.clear();
      }
      if (!catalogDb.isOpen()) {
        await catalogDb.open();
      }
      for (const t of catalogDb.tables) {
        await t.clear();
      }
      await seedDatabase();
      antMessage.success('Active databases seeded with initial mock data!');
      await fetchAllStorageData();
    } catch (err: any) {
      console.error('Re-seed error:', err);
      antMessage.error('Failed to seed database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
              <Lucide.Database size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white m-0">Browser Storage & Session Manager</h1>
              <p className="text-xs text-slate-400 m-0">Manage IndexedDB, LocalStorage, SessionStorage, and Cookies.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AntButton
              type="primary"
              size="small"
              icon={<Lucide.RotateCcw size={13} />}
              onClick={handleReSeed}
              loading={loading}
              className="bg-sky-600 hover:bg-sky-700 font-medium text-xs py-1.5 px-3 h-auto"
            >
              Re-Seed DB
            </AntButton>

            <AntButton
              icon={<Lucide.RefreshCw size={14} />}
              onClick={fetchAllStorageData}
              loading={loading}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:text-white"
            >
              Refresh
            </AntButton>
          </div>
        </div>

        {/* Section 1: All IndexedDB Databases */}
        <AntCard className="bg-slate-950 border-slate-800 text-slate-100 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Lucide.HardDrive size={18} className="text-sky-400" />
              <h2 className="text-base font-bold text-white m-0">
                IndexedDB Databases ({databases.length})
              </h2>
            </div>
          </div>

          {loading && databases.length === 0 ? (
            <div className="py-8 text-center"><Spin /></div>
          ) : databases.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-6 text-center">No IndexedDB databases found.</div>
          ) : (
            <div className="space-y-3">
              {databases.map((item) => {
                const isActive = item.name === userDb.name;
                return (
                  <div
                    key={item.name}
                    className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-4 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center shrink-0">
                        <Lucide.Database size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sky-300 font-bold text-sm truncate">{item.name}</span>
                          {isActive && <AntTag color="green" className="m-0 text-[10px]">Active App DB</AntTag>}
                        </div>
                        <span className="text-slate-400 text-[11px] block mt-0.5">Version: {item.version}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <AntPopconfirm
                        title={`Delete Database '${item.name}'?`}
                        description="Are you sure you want to permanently delete this IndexedDB database?"
                        onConfirm={() => handleDeleteDatabase(item.name)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                      >
                        <AntButton
                          danger
                          size="small"
                          icon={<Lucide.Trash2 size={13} />}
                          loading={loading}
                          className="font-medium text-xs flex items-center gap-1"
                        >
                          Delete DB
                        </AntButton>
                      </AntPopconfirm>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AntCard>

        {/* Section 2: LocalStorage Items */}
        <AntCard className="bg-slate-950 border-slate-800 text-slate-100 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Lucide.FolderGit2 size={18} className="text-purple-400" />
              <h2 className="text-base font-bold text-white m-0">
                LocalStorage Items ({localStorageItems.length})
              </h2>
            </div>

            {localStorageItems.length > 0 && (
              <AntPopconfirm
                title="Clear LocalStorage"
                description="Are you sure you want to remove all items from LocalStorage?"
                onConfirm={handleClearLocalStorage}
                okText="Yes, Clear All"
                cancelText="Cancel"
              >
                <AntButton danger size="small" icon={<Lucide.Trash2 size={13} />}>
                  Clear LocalStorage
                </AntButton>
              </AntPopconfirm>
            )}
          </div>

          {localStorageItems.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-4 text-center">No items in LocalStorage.</div>
          ) : (
            <div className="space-y-2">
              {localStorageItems.map((item) => (
                <div
                  key={item.key}
                  className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sky-300 font-semibold truncate">{item.key}</div>
                    <div className="text-slate-400 text-[11px] truncate mt-0.5">{item.value}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <AntTag color="purple" className="m-0 text-[10px]">{item.size}</AntTag>
                    <AntPopconfirm
                      title={`Remove '${item.key}'?`}
                      onConfirm={() => handleDeleteLocalStorageKey(item.key)}
                      okText="Remove"
                      cancelText="Cancel"
                    >
                      <AntButton
                        type="text"
                        danger
                        size="small"
                        icon={<Lucide.Trash2 size={14} />}
                      />
                    </AntPopconfirm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AntCard>

        {/* Section 3: SessionStorage Items */}
        <AntCard className="bg-slate-950 border-slate-800 text-slate-100 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Lucide.Clock size={18} className="text-amber-400" />
              <h2 className="text-base font-bold text-white m-0">
                SessionStorage Items ({sessionStorageItems.length})
              </h2>
            </div>

            {sessionStorageItems.length > 0 && (
              <AntPopconfirm
                title="Clear SessionStorage"
                description="Are you sure you want to remove all items from SessionStorage?"
                onConfirm={handleClearSessionStorage}
                okText="Yes, Clear All"
                cancelText="Cancel"
              >
                <AntButton danger size="small" icon={<Lucide.Trash2 size={13} />}>
                  Clear SessionStorage
                </AntButton>
              </AntPopconfirm>
            )}
          </div>

          {sessionStorageItems.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-4 text-center">No items in SessionStorage.</div>
          ) : (
            <div className="space-y-2">
              {sessionStorageItems.map((item) => (
                <div
                  key={item.key}
                  className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-amber-300 font-semibold truncate">{item.key}</div>
                    <div className="text-slate-400 text-[11px] truncate mt-0.5">{item.value}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <AntTag color="gold" className="m-0 text-[10px]">{item.size}</AntTag>
                    <AntPopconfirm
                      title={`Remove '${item.key}'?`}
                      onConfirm={() => handleDeleteSessionStorageKey(item.key)}
                      okText="Remove"
                      cancelText="Cancel"
                    >
                      <AntButton
                        type="text"
                        danger
                        size="small"
                        icon={<Lucide.Trash2 size={14} />}
                      />
                    </AntPopconfirm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AntCard>

        {/* Section 4: Cookies Management */}
        <AntCard className="bg-slate-950 border-slate-800 text-slate-100 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Lucide.Cookie size={18} className="text-emerald-400" />
              <h2 className="text-base font-bold text-white m-0">
                Browser Cookies ({cookieItems.length})
              </h2>
            </div>

            {cookieItems.length > 0 && (
              <AntPopconfirm
                title="Clear All Cookies"
                description="Are you sure you want to delete all cookies for this site?"
                onConfirm={handleClearAllCookies}
                okText="Yes, Clear All"
                cancelText="Cancel"
              >
                <AntButton danger size="small" icon={<Lucide.Trash2 size={13} />}>
                  Clear Cookies
                </AntButton>
              </AntPopconfirm>
            )}
          </div>

          {cookieItems.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-4 text-center">No cookies found for this site.</div>
          ) : (
            <div className="space-y-2">
              {cookieItems.map((item) => (
                <div
                  key={item.key}
                  className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-emerald-300 font-semibold truncate">{item.key}</div>
                    <div className="text-slate-400 text-[11px] truncate mt-0.5">{item.value}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <AntTag color="green" className="m-0 text-[10px]">{item.size}</AntTag>
                    <AntPopconfirm
                      title={`Delete cookie '${item.key}'?`}
                      onConfirm={() => handleDeleteCookie(item.key)}
                      okText="Delete"
                      cancelText="Cancel"
                    >
                      <AntButton
                        type="text"
                        danger
                        size="small"
                        icon={<Lucide.Trash2 size={14} />}
                      />
                    </AntPopconfirm>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AntCard>
      </div>
    </div>
  );
};

export default IndexedDbManager;
