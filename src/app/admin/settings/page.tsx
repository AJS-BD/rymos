export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Admin panel settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Store Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                defaultValue="RYmos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black">
                <option value="BDT">Bangladeshi Taka (৳)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
