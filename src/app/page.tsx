import Image from "next/image";
import { LoginForm } from "../features/authentication";
import { UserStats } from "../features/dashboard/components/UserStats";
import { Button } from "../shared/components";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="SB Portal Logo"
                width={120}
                height={25}
                priority
              />
              <span className="ml-3 text-xl font-semibold text-gray-900">Portal Web</span>
            </div>
            <Button variant="primary">Sign In</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to SB Portal Web
          </h1>
          <p className="text-gray-600">
            Built with Domain-Driven Design (DDD) and Feature-Based Architecture
          </p>
        </div>

        {/* Architecture Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Login Demo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Feature</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Demonstrates feature-based architecture with self-contained components, hooks, and services.
            </p>
            <LoginForm />
          </div>

          {/* Dashboard Demo */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard Feature</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Shows how features can use domain entities and services.
            </p>
            <UserStats />
          </div>
        </div>

        {/* Architecture Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Architecture Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Domains</h3>
              <p className="text-blue-700 text-sm">
                Business logic, entities, value objects, and domain services following DDD principles.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Features</h3>
              <p className="text-green-700 text-sm">
                Self-contained feature modules with components, hooks, services, and types.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Shared</h3>
              <p className="text-purple-700 text-sm">
                Reusable components, utilities, constants, and types used across features.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">Infrastructure</h3>
              <p className="text-orange-700 text-sm">
                External concerns like API clients, storage, and third-party integrations.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              Built with Next.js, TypeScript, and Tailwind CSS
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                Documentation
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
