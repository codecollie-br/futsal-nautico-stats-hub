
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Users, Trophy, Calendar, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/jogadores", icon: Users, label: "Jogadores" },
    { path: "/partida", icon: Trophy, label: "Partida Ao Vivo" },
    { path: "/historico", icon: Calendar, label: "Histórico" },
    { path: "/admin", icon: Settings, label: "Admin" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">Futsal Náutico</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? "bg-red-700 text-white"
                    : "text-red-100 hover:bg-red-500 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white hover:bg-red-500"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "bg-red-700 text-white"
                      : "text-red-100 hover:bg-red-500 hover:text-white"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
