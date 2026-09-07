export default function AdminMessages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500">Customer messages inbox</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <p className="text-gray-500">No messages yet</p>
      </div>
    </div>
  );
}
