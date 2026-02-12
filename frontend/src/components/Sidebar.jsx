import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBookOpen,
  FaHome,
  FaDatabase,
  FaChevronDown,
  FaChevronRight,
  FaUsers,
  FaBuilding,
  FaQuestionCircle
} from "react-icons/fa";
import { sidebarConfig } from '../config/sidebarConfig';
import useStore from '../store';

const SidebarSection = ({ title, children, defaultOpen = false, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex h-full items-center justify-between px-3 py-2 text-sm text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900 rounded-md transition"
      >
        <div className="flex items-center gap-3">
             {Icon && <Icon className="w-4 h-4" />}
            <span className="font-medium">{title}</span>
        </div>
        {children && (isOpen ? <FaChevronDown className="w-3 h-3" /> : <FaChevronRight className="w-3 h-3" />)}
      </button>
      {isOpen && children && (
        <div className="ml-4 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ onClose }) => {
  const { currentRole } = useStore();
  const linkBase = "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition";

  const menuItems = sidebarConfig[currentRole] || [];

  return (
    <aside className="flex flex-col w-60 h-screen border-r border-neutral-200 bg-[#0F172A] relative">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-neutral-200">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 flex items-center justify-center bg-neutral-900 rounded-md">
             <FaBookOpen className="text-white text-sm" />
           </div>
           <span className="text-lg text-[#CBD5E1]">ERP System</span>
         </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto pb-16" style={{msOverflowStyle: 'none', scrollbarWidth: 'none', scrollbarColor: '#0F172A #0F172A'}}>
        <ul className="space-y-1">
          {/* Dashboard is common */}
          <li>
            <NavLink
              to="/dashboard"
               onClick={onClose}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900"
                }`
              }
            >
              <FaHome className="w-4 h-4" />
              Dashboard
            </NavLink>
          </li>

          {/* Dynamic Menu items */}
          {menuItems.map((section, index) => (
             <li key={index}>
                {section.children ? (
                    <SidebarSection 
                        title={section.title} 
                        icon={section.icon} 
                        defaultOpen={index === 0} // Open first section by default
                    >
                        {section.children.map((child, childIndex) => (
                            <NavLink
                                key={child.path || childIndex}
                                to={child.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900 ${isActive ? "bg-neutral-100 text-neutral-900" : ""}`
                                }
                            >
                                {child.icon && <child.icon className="w-4 h-4" />}
                                {child.title}
                            </NavLink>
                        ))}
                    </SidebarSection>
                ) : (
                    <NavLink
                        to={section.path}
                        onClick={onClose}
                         className={({ isActive }) =>
                            `${linkBase} ${
                              isActive
                                ? "bg-neutral-100 text-neutral-900"
                                : "text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900"
                            }`
                          }
                    >
                        {section.icon && <section.icon className="w-4 h-4" />}
                        {section.title}
                    </NavLink>
                )}
             </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 w-60 p-4 border-t border-neutral-200 bg-[#0F172A] z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full">
            <FaQuestionCircle className="text-neutral-600 text-sm" />
          </div>
          <div>
            <p className="text-sm text-[#CBD5E1]">
              <span className="hover:text-white transition cursor-pointer">
                Help & Support
              </span>
            </p>
            <p className="text-xs text-neutral-500">Get assistance</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
