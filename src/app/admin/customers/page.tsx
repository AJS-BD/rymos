import { getSupabase, isConfigured } from "@/lib/supabase";

async function getCustomers() {
  if (!isConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
  return data || [];
}

export default async function AdminCustomers() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500">{customers.length} customers total</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Phone</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Address</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No customers yet
                </td>
              </tr>
            ) : (
              customers.map((customer: any) => (
                <tr key={customer.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{customer.full_name}</p>
                    <p className="text-xs text-gray-500">@{customer.username}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{customer.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.address}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      customer.customer_type === "online" ? "bg-blue-100 text-blue-700" :
                      customer.customer_type === "walk_in" ? "bg-green-100 text-green-700" :
                      "bg-purple-100 text-purple-700"
                    }`}>
                      {customer.customer_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
