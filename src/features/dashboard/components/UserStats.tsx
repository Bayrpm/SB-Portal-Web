'use client';

import { useEffect, useState } from 'react';

interface UserStatsProps {
  className?: string;
}

interface UserStatsData {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

export function UserStats({ className = '' }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This would typically call a service that uses the UserRepository
        // For now, we'll simulate the data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        setStats({
          totalUsers: 1250,
          activeUsers: 890,
          newUsersThisMonth: 45,
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <p className="text-red-600">Failed to load user statistics</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Users</span>
          <span className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Active Users</span>
          <span className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">New This Month</span>
          <span className="text-2xl font-bold text-purple-600">{stats.newUsersThisMonth}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Activity Rate: {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
        </div>
      </div>
    </div>
  );
}