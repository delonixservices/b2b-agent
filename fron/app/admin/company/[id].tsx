"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getCompanyById,
  getAdminToken,
} from "../../services/adminApi";

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  // Add other fields as needed
}

export default function CompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  const [company, setCompany] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = getAdminToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
        setLoading(true);
        // Fetch company info
        const companyRes = await getCompanyById(token, companyId);
        setCompany(companyRes.data.company);
        // Fetch employees
        const empRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_PATH}/api/owner/companies/${companyId}/employees`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!empRes.ok) throw new Error("Failed to fetch employees");
        const empData = await empRes.json();
        setEmployees(empData.data.employees);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    if (companyId) fetchData();
  }, [companyId, router]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!company) {
    return <div className="p-8 text-center">Company not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Company Details</h1>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div><b>Name:</b> {company.companyName || company.name}</div>
          <div><b>Email:</b> {company.email}</div>
          <div><b>Phone:</b> {company.phone}</div>
          <div><b>Address:</b> {company.address}</div>
          <div><b>Status:</b> {company.status}</div>
          <div><b>Active:</b> {company.isActive ? "Yes" : "No"}</div>
          <div><b>Created At:</b> {new Date(company.createdAt).toLocaleString()}</div>
          <div><b>Updated At:</b> {new Date(company.updatedAt).toLocaleString()}</div>
        </div>
        {/* Add more fields as needed */}
      </div>
      <h2 className="text-xl font-semibold mt-8 mb-2">Employees</h2>
      {employees.length === 0 ? (
        <div>No employees found for this company.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td className="px-4 py-2">{emp.name}</td>
                  <td className="px-4 py-2">{emp.email}</td>
                  <td className="px-4 py-2">{emp.phone}</td>
                  <td className="px-4 py-2">{emp.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{new Date(emp.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 