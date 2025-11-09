import { useState, useEffect } from "react";
import { Plus, ChevronDown } from "lucide-react";

interface TenantSelectorProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
  onTenantCreated: () => void;
}

export default function TenantSelector({
  selectedTenant,
  onTenantChange,
  onTenantCreated,
}: TenantSelectorProps) {
  const [tenants, setTenants] = useState<string[]>([]);
  const [newTenantName, setNewTenantName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await fetch("/api/tenants");

      if (!response.ok) {
        console.error("Failed to load tenants:", response.status);
        setTenants(["default"]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const tenantList = Object.keys(data);
      setTenants(tenantList.length > 0 ? tenantList : ["default"]);
      if (!selectedTenant && tenantList.length > 0) {
        onTenantChange(tenantList[0]);
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
      setTenants(["default"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTenantName.trim() }),
      });

      if (response.ok) {
        const newTenant = newTenantName.trim();
        setTenants([...tenants, newTenant]);
        setNewTenantName("");
        setIsCreating(false);
        onTenantChange(newTenant);
        onTenantCreated();
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-12 bg-muted rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-foreground mb-2">
          Tenant
        </label>
        <div className="relative">
          <select
            value={selectedTenant}
            onChange={(e) => onTenantChange(e.target.value)}
            className="input-field w-full appearance-none pr-10"
          >
            {tenants.map((tenant) => (
              <option key={tenant} value={tenant}>
                {tenant}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground"
          />
        </div>
      </div>

      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-3 border border-dashed border-border hover:border-primary rounded-lg transition-colors text-muted-foreground hover:text-primary"
          type="button"
          title="Create new tenant"
        >
          <Plus size={18} />
          <span className="hidden sm:inline text-sm font-medium">New</span>
        </button>
      )}

      {isCreating && (
        <form onSubmit={handleCreateTenant} className="flex gap-2">
          <input
            type="text"
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            placeholder="Tenant name..."
            className="input-field text-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newTenantName.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium whitespace-nowrap"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewTenantName("");
            }}
            className="px-3 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
