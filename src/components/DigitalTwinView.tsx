import React, { useState, useEffect } from 'react';
import {
  Database,
  Building,
  Package,
  Layers,
  Users,
  ShoppingBag,
  FileCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Factory,
} from 'lucide-react';

export const DigitalTwinView: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('suppliers');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const entityTabs = [
    { id: 'suppliers', label: 'Suppliers (Master)', icon: Factory },
    { id: 'materials', label: 'Raw Materials & Parts', icon: Package },
    { id: 'boms', label: 'Bill of Materials (BOM)', icon: Layers },
    { id: 'products', label: 'Finished Products', icon: Database },
    { id: 'plants', label: 'Assembly Facilities', icon: Building },
    { id: 'customers', label: 'Key Customer Accounts', icon: Users },
    { id: 'purchase_orders', label: 'Purchase Orders (PO)', icon: ShoppingBag },
    { id: 'customer_orders', label: 'Customer Orders', icon: ShoppingBag },
    { id: 'contracts', label: 'Supplier SLA Contracts', icon: FileCheck },
  ];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/digital-twin/${selectedEntity}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(Array.isArray(resData) ? resData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load entity data:', err);
        setLoading(false);
      });
  }, [selectedEntity]);

  const filteredData = data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              SUPPLY CHAIN DIGITAL TWIN REPOSITORY
            </span>
            <span className="text-xs font-mono text-slate-500">22 Relational Data Entities</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Enterprise Digital Twin State Explorer
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Live inspect the multi-tier enterprise digital twin: suppliers, multi-echelon BOM structures, inventory buffers, contracts, and sales commitments.
          </p>
        </div>
      </div>

      {/* Entity Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {entityTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedEntity === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedEntity(tab.id);
                setSearchTerm('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Filter ${selectedEntity.replace(/_/g, ' ')} records...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {filteredData.length} records in {selectedEntity}
        </div>
      </div>

      {/* Entity Table Display */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          {filteredData.length > 0 ? (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider sticky top-0">
                <tr>
                  {Object.keys(filteredData[0]).map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 whitespace-nowrap max-w-xs truncate">
                        {typeof val === 'object' && val !== null ? (
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {JSON.stringify(val)}
                          </span>
                        ) : typeof val === 'boolean' ? (
                          val ? (
                            <span className="text-emerald-700 font-bold">YES</span>
                          ) : (
                            <span className="text-slate-400">NO</span>
                          )
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              {loading ? 'Loading entity records...' : 'No records found matching filter.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
