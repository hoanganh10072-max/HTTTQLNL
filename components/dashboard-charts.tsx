"use client";

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export function DepartmentChart({ data }: { data: { name: string; value: number }[] }) {
  return <div className="h-72 w-full"><ResponsiveContainer><BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: -15 }}><CartesianGrid stroke="#dce7f4" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#70819b" }}/><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#70819b" }}/><Tooltip/><Bar dataKey="value" name="Nhân viên" fill="#0875e1" radius={[7, 7, 0, 0]}/></BarChart></ResponsiveContainer></div>;
}

export function MovementChart({ data }: { data: { month: string; join: number; leave: number }[] }) {
  return <div className="h-72 w-full"><ResponsiveContainer><LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: -15 }}><CartesianGrid stroke="#dce7f4" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" tick={{ fontSize: 11, fill: "#70819b" }}/><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#70819b" }}/><Tooltip/><Line type="monotone" dataKey="join" name="Gia nhập" stroke="#0875e1" strokeWidth={2.5}/><Line type="monotone" dataKey="leave" name="Nghỉ việc" stroke="#79aee6" strokeWidth={2.5}/></LineChart></ResponsiveContainer></div>;
}
