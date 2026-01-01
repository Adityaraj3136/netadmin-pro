import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Wifi, Shield, Globe, Cpu, Smartphone, 
  Settings, Terminal, LogOut, Menu, X, Save, 
  RefreshCw, Upload, Download, Moon, Sun, Search,
  AlertTriangle, CheckCircle, Lock, Server, Play, Pause,
  Cloud, Laptop, Share2, Sliders, Clock, Key, Layers, 
  BarChart2, AlertOctagon, Zap, Trash2, Plus, HardDrive, 
  Folder, FileText, Film, Music, Image as ImageIcon, Move,
  User, ChevronDown, Edit2, Link
} from 'lucide-react';

// --- UTILITIES & MOCK DATA ---

const generateRandomTraffic = () => Math.floor(Math.random() * 100); // Mbps

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const isValidIP = (ip) => {
  const pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return pattern.test(ip);
};

// Default Configuration
const DEFAULT_CONFIG = {
  system: {
    hostname: 'NetAdmin-Pro-X1',
    firmware: 'v3.0.0-enterprise',
    uptime: 0,
    adminPassword: 'admin',
    cpuLoad: 12,
    memLoad: 45
  },
  wan: {
    type: 'dhcp',
    ip: '192.0.2.45',
    gateway: '192.0.2.1',
    dns: 'auto',
    username: '',
    password: '',
    mtu: 1500,
    macClone: false,
    clonedMac: '00:1A:2B:3C:4D:5E',
    ipv6Enabled: false,
    ipv6Address: '2001:db8:85a3::8a2e:370:7334',
    ipv6Gateway: '2001:db8:85a3::1'
  },
  lan: {
    ip: '192.168.1.1',
    subnet: '255.255.255.0',
    dhcpEnabled: true,
    dhcpStart: '192.168.1.100',
    dhcpEnd: '192.168.1.200',
    leaseTime: 120,
    igmpSnooping: true,
    ipv6Prefix: 'fd00:1234:5678::/64'
  },
  ddns: {
    enabled: false,
    provider: 'noip',
    hostname: '',
    username: '',
    password: ''
  },
  wireless: {
    enabled: true,
    ssid: 'NetAdmin_Pro_5G',
    password: 'securepassword123',
    security: 'wpa2',
    channel: 'auto',
    band: '5ghz',
    guestEnabled: false,
    guestSsid: 'NetAdmin_Guest',
    guestPassword: 'guestaccessonly',
    guestIsolation: true
  },
  firewall: {
    enabled: true,
    portForwarding: [
      { id: 1, name: 'Web Server', port: 80, ip: '192.168.1.50', protocol: 'TCP' }
    ],
    ddosProtection: false
  },
  qos: {
    enabled: false,
    uploadLimit: 0,
    downloadLimit: 0,
    priorities: []
  },
  parental: {
    enabled: false,
    rules: [
        { id: 1, name: "Kid's iPad", mac: "AA:BB:CC:11:22:33", startTime: "21:00", endTime: "07:00", blockedDomains: "tiktok.com" }
    ]
  },
  vpn: {
    enabled: false,
    type: 'wireguard',
    port: 51820,
    subnet: '10.8.0.0/24'
  },
  vlan: {
    enabled: false,
    ports: [
      { id: 1, vlanId: 1, type: 'untagged' },
      { id: 2, vlanId: 1, type: 'untagged' },
      { id: 3, vlanId: 10, type: 'untagged' },
      { id: 4, vlanId: 20, type: 'tagged' }
    ]
  },
  storage: {
    enabled: true,
    name: 'Samsung_T7_SSD',
    used: 450 * 1024 * 1024 * 1024, // 450GB
    total: 1024 * 1024 * 1024 * 1024 // 1TB
  }
};

const DEFAULT_CLIENTS = [
  { id: 1, name: 'John-iPhone', ip: '192.168.1.101', mac: 'AA:BB:CC:11:22:33', type: 'wifi', status: 'online', blocked: false, usage: 15 },
  { id: 2, name: 'LivingRoom-TV', ip: '192.168.1.102', mac: 'AA:BB:CC:44:55:66', type: 'ethernet', status: 'online', blocked: false, usage: 85 },
  { id: 3, name: 'Unknown-Device', ip: '192.168.1.105', mac: '11:22:33:44:55:66', type: 'wifi', status: 'offline', blocked: true, usage: 0 },
  { id: 4, name: 'Gaming-PC', ip: '192.168.1.110', mac: 'DD:EE:FF:77:88:99', type: 'ethernet', status: 'online', blocked: false, usage: 120 },
];

const SCENARIOS = [
  {
    id: 'dhcp_conflict',
    title: 'IP Address Conflict',
    description: 'Users report they cannot connect to the internet. The router LAN IP seems to be colliding with the WAN Gateway.',
    setup: (cfg) => { cfg.wan.ip = '192.168.1.1'; cfg.wan.gateway = '192.168.1.1'; cfg.lan.ip = '192.168.1.1'; },
    check: (cfg) => cfg.lan.ip !== cfg.wan.ip && cfg.lan.ip !== cfg.wan.gateway
  },
  {
    id: 'wifi_security',
    title: 'Open Wi-Fi Risk',
    description: 'Security audit failed. The Wi-Fi network is currently open and has no password.',
    setup: (cfg) => { cfg.wireless.security = 'none'; cfg.wireless.password = ''; },
    check: (cfg) => cfg.wireless.security !== 'none' && cfg.wireless.password.length >= 8
  },
  {
    id: 'dns_down',
    title: 'DNS Server Failure',
    description: 'The ISP DNS server is down. Change the WAN DNS to a public provider (e.g., 1.1.1.1 or 8.8.8.8) manually.',
    setup: (cfg) => { cfg.wan.dns = 'auto'; },
    check: (cfg) => cfg.wan.dns !== 'auto'
  }
];

const MOCK_FILES = [
  { name: 'Backups', type: 'folder', size: 0, date: '2023-10-01' },
  { name: 'Movies', type: 'folder', size: 0, date: '2023-10-05' },
  { name: 'network_config_v2.json', type: 'file', size: 2048, date: '2023-10-25' },
  { name: 'vacation_photo.jpg', type: 'file', size: 4500000, date: '2023-09-15' },
];

// --- COMPONENTS ---

const Card = ({ title, children, className = "", actions, noPadding = false }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
      {title}
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);

const Toggle = ({ enabled, onChange, label, subLabel }) => (
  <div className="flex items-center justify-between py-3">
    <div>
       <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
       {subLabel && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subLabel}</span>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const Input = ({ label, value, onChange, type = "text", error, disabled, placeholder }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white transition-colors
        ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}
      `}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', icon: Icon, disabled, className="" }) => {
  const base = "inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    secondary: "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700",
    success: "border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};

// --- SIMULATED TERMINAL ---
const TerminalCLI = ({ config, updateConfig, setRebooting, onFactoryReset }) => {
  const [history, setHistory] = useState([
    { type: 'info', text: `NetAdmin OS ${config.system.firmware} (Linux 5.10.0)` },
    { type: 'info', text: 'Type "help" for a list of commands.' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [history]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim(); 
      const args = cmd.split(' ');
      const command = args[0].toLowerCase();
      
      const newHistory = [...history, { type: 'input', text: `admin@${config.system.hostname}:~# ${input}` }];
      let response = [];

      switch (command) {
        case 'help':
          response = [{ type: 'info', text: 'Available commands:\n  ping <host>      Check network connectivity\n  traceroute <ip>  Trace path to host\n  ip addr          Show interface details\n  passwd <pass>    Change admin password\n  reboot           Restart the router\n  update           Check for firmware updates\n  reset -y         Factory reset device\n  clear            Clear terminal screen' }];
          break;
        case 'clear':
          setHistory([]); setInput(''); return;
        case 'ping':
          if (!args[1]) response = [{ type: 'error', text: 'Usage: ping <host>' }];
          else response = [{ type: 'success', text: `PING ${args[1]} (56 data bytes)\n64 bytes from ${args[1]}: icmp_seq=1 ttl=56 time=${(Math.random() * 10).toFixed(2)} ms\n64 bytes from ${args[1]}: icmp_seq=2 ttl=56 time=${(Math.random() * 10).toFixed(2)} ms\n64 bytes from ${args[1]}: icmp_seq=3 ttl=56 time=${(Math.random() * 10).toFixed(2)} ms` }];
          break;
        case 'traceroute':
           if (!args[1]) response = [{ type: 'error', text: 'Usage: traceroute <host>' }];
           else response = [{ type: 'info', text: `traceroute to ${args[1]} (142.250.180.14), 30 hops max, 60 byte packets\n 1  gateway (${config.lan.ip})  0.223 ms  0.198 ms  0.185 ms\n 2  10.20.0.1 (10.20.0.1)  2.112 ms  2.051 ms  2.110 ms\n 3  isp-core.net (203.0.113.5)  4.512 ms  4.201 ms  4.111 ms\n 4  ${args[1]} (142.250.180.14)  12.102 ms  12.001 ms  11.998 ms` }];
           break;
        case 'ip':
           if (args[1] === 'addr' || !args[1]) response = [{ type: 'info', text: `eth0 (WAN): ${config.wan.ip}/24 UP\n    link/ether ${config.wan.mac || 'AA:BB:CC:DD:EE:01'} brd ff:ff:ff:ff:ff:ff\nbr0 (LAN): ${config.lan.ip}/24 UP\n    link/ether ${config.wan.mac || 'AA:BB:CC:DD:EE:02'} brd ff:ff:ff:ff:ff:ff` }];
           break;
        case 'passwd':
           if (!args[1]) {
             response = [{ type: 'error', text: 'Usage: passwd <new_password>' }];
           } else {
             updateConfig('system', 'adminPassword', args[1]);
             response = [{ type: 'success', text: 'passwd: password updated successfully' }];
           }
           break;
        case 'reboot':
           response = [{ type: 'warning', text: 'Broadcast message from root@NetAdmin-Pro-X1:\nThe system is going down for reboot NOW!' }];
           setTimeout(() => setRebooting(true), 1500);
           break;
        case 'update':
           response = [{ type: 'info', text: 'Connecting to update server... Connected.\nChecking firmware... Found v3.1.0-stable.\nDownloading image... [####################] 100%\nVerifying signature... OK.\nSystem configured to boot new image on restart.' }];
           updateConfig('system', 'firmware', 'v3.1.0-stable');
           break;
        case 'reset':
           if (args[1] === '-y') {
             response = [{ type: 'warning', text: 'Erasing nvram... Done.\nRestoring factory defaults...' }];
             setTimeout(onFactoryReset, 1500);
           } else {
             response = [{ type: 'error', text: 'WARNING: This will erase all settings.\nType "reset -y" to confirm.' }];
           }
           break;
        default:
          response = [{ type: 'error', text: `Command not found: ${command}` }];
      }
      setHistory([...newHistory, ...response]);
      setInput('');
    }
  };

  return (
    <div 
      className="bg-slate-950 text-green-500 font-mono p-4 rounded-lg shadow-inner h-96 overflow-y-auto text-sm border border-slate-700 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {history.map((line, i) => (
        <div key={i} className={`mb-1 ${line.type === 'error' ? 'text-red-400' : line.type === 'warning' ? 'text-yellow-400' : line.type === 'input' ? 'text-white' : ''} whitespace-pre-wrap`}>{line.text}</div>
      ))}
      <div className="flex flex-row items-center">
        <span className="shrink-0 mr-2 text-blue-400 font-bold">admin@{config.system.hostname}:~#</span>
        <input 
          ref={inputRef}
          className="flex-1 bg-transparent border-none focus:outline-none text-white p-0 m-0 w-full font-mono" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={handleCommand} 
          autoFocus 
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [rebootProgress, setRebootProgress] = useState(0);
  const [toast, setToast] = useState(null);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  // Parental Control Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [currentRuleId, setCurrentRuleId] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    mac: '',
    startTime: '21:00',
    endTime: '07:00',
    blockedDomains: ''
  });

  // Security/Port Forwarding Modal State
  const [isSecurityRuleModalOpen, setIsSecurityRuleModalOpen] = useState(false);
  const [securityRuleForm, setSecurityRuleForm] = useState({
    name: '',
    port: '',
    ip: '',
    protocol: 'TCP'
  });

  // Troubleshooting Mode State
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioSolved, setScenarioSolved] = useState(false);

  // Core Router State
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('routerConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  
  const [clients, setClients] = useState(DEFAULT_CLIENTS);
  
  // Real-time Simulation State
  const [trafficHistory, setTrafficHistory] = useState(Array(60).fill({ up: 0, down: 0 }));
  const [dpiData, setDpiData] = useState({ streaming: 30, gaming: 10, web: 40, others: 20 });
  
  // Dynamic System Stats (CPU/RAM)
  const [systemStats, setSystemStats] = useState({ cpu: 12, mem: 45 });

  // Uptime: Randomize start if it's 0 (simulating existing runtime), else use config
  const [uptime, setUptime] = useState(() => {
    // If < 60 seconds (basically 0), generate random uptime between 2 hours and 7 days
    if (config.system.uptime < 60) {
        return Math.floor(Math.random() * (604800 - 7200) + 7200);
    }
    return config.system.uptime;
  });

  // Dynamic Wi-Fi Analyzer State
  const [userSignalStrength, setUserSignalStrength] = useState(85);
  const [wifiNeighbors, setWifiNeighbors] = useState([
    { id: 1, channel: 1, name: 'Neighbor-WiFi', color: '#3b82f6', strength: 65 },
    { id: 2, channel: 11, name: 'Coffee-Shop-Free', color: '#ef4444', strength: 55 },
    { id: 3, channel: 4, name: 'Weak-Signal-X', color: '#eab308', strength: 30 }
  ]);
  
  // Map Node Positions for Dragging (Static Layout for Hover)
  const [nodes, setNodes] = useState({
     internet: { x: 50, y: 15 },
     router: { x: 50, y: 45 },
     clients: clients.map((c, i) => ({ id: c.id, x: (i + 1) * (100 / (clients.length + 1)), y: 80 }))
  });

  // Hovered Node State for Topology
  const [hoveredNode, setHoveredNode] = useState(null);
  const mapRef = useRef(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('routerConfig', JSON.stringify(config));
    if (activeScenario && !scenarioSolved) {
        if (activeScenario.check(config)) {
            setScenarioSolved(true);
            showToast('PROBLEM SOLVED! Great job engineer.', 'success');
        }
    }
  }, [config, activeScenario, scenarioSolved]);

  // Main Simulation Loop (Traffic, Uptime, DPI)
  useEffect(() => {
    if (rebooting || !isLoggedIn) return; // Pause sim if not logged in
    const interval = setInterval(() => {
      // 1. Traffic History for SVG Chart
      setTrafficHistory(prev => {
        const newUp = Math.max(0, generateRandomTraffic() + (Math.sin(Date.now() / 1000) * 20));
        const newDown = Math.max(0, generateRandomTraffic() * 1.5 + (Math.cos(Date.now() / 2000) * 30));
        return [...prev.slice(1), { up: newUp, down: newDown }];
      });

      // 2. DPI Data Shift
      setDpiData(prev => {
         // Calculate new raw values with random walk
         let s = Math.max(10, prev.streaming + (Math.random() - 0.5) * 5);
         let g = Math.max(5, prev.gaming + (Math.random() - 0.5) * 3);
         let w = Math.max(20, prev.web + (Math.random() - 0.5) * 4);
         
         // Normalize to ensure they sum to exactly 100% to prevent chart overlap/gaps
         const total = s + g + w;
         const scale = 100 / total;
         
         return {
             streaming: s * scale,
             gaming: g * scale,
             web: w * scale,
             others: 0
         };
      });

      // 3. System Load Simulation
      setSystemStats(prev => ({
          cpu: Math.max(2, Math.min(100, prev.cpu + (Math.random() - 0.5) * 15)), // CPU spikes more
          mem: Math.max(20, Math.min(90, prev.mem + (Math.random() - 0.5) * 2))   // Memory is more stable
      }));

      // 4. Wi-Fi Signal Simulation
      setWifiNeighbors(prev => prev.map(n => ({
        ...n,
        strength: Math.max(20, Math.min(95, n.strength + (Math.random() - 0.5) * 10))
      })));
      setUserSignalStrength(prev => Math.max(60, Math.min(98, prev + (Math.random() - 0.5) * 5)));

      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [rebooting, isLoggedIn]);

  // Reboot Loop
  useEffect(() => {
    if (rebooting) {
      const interval = setInterval(() => {
        setRebootProgress(prev => {
          if (prev >= 100) {
            setRebooting(false);
            setRebootProgress(0);
            setUptime(0); // Reset uptime to 0 after reboot
            setSystemStats({ cpu: 5, mem: 20 }); // Reset stats to low
            showToast('Router rebooted successfully', 'success');
            clearInterval(interval);
            return 0;
          }
          return prev + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [rebooting]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple mock auth check
    if (loginForm.username === 'admin' && loginForm.password === config.system.adminPassword) {
      setIsLoggedIn(true);
      setLoginError('');
      // In a real app, we'd set a token here
    } else {
      setLoginError('Invalid credentials. Default: admin / admin');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowUserMenu(false);
    setLoginForm({ username: '', password: '' });
    showToast('Logged out successfully', 'info');
  };

  const updateConfig = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  const handleSave = () => showToast('Configuration saved successfully.', 'success');

  // Parental Control Handlers
  const openAddRuleModal = () => {
    setCurrentRuleId(null);
    setRuleForm({ name: '', mac: '', startTime: '21:00', endTime: '07:00', blockedDomains: '' });
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (rule) => {
    setCurrentRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      mac: rule.mac,
      startTime: rule.startTime,
      endTime: rule.endTime,
      blockedDomains: rule.blockedDomains
    });
    setIsRuleModalOpen(true);
  };

  const saveRule = () => {
    if (!ruleForm.name || !ruleForm.mac) {
      showToast('Device Name and MAC Address are required', 'danger');
      return;
    }

    let newRules;
    if (currentRuleId) {
      // Edit existing
      newRules = config.parental.rules.map(r => 
        r.id === currentRuleId ? { ...r, ...ruleForm } : r
      );
      showToast('Rule updated successfully', 'success');
    } else {
      // Add new
      const newRule = {
        id: Date.now(),
        ...ruleForm
      };
      newRules = [...config.parental.rules, newRule];
      showToast('New rule created', 'success');
    }
    
    updateConfig('parental', 'rules', newRules);
    setIsRuleModalOpen(false);
  };

  const openAddSecurityRuleModal = () => {
    setSecurityRuleForm({ name: '', port: '', ip: '', protocol: 'TCP' });
    setIsSecurityRuleModalOpen(true);
  };

  const saveSecurityRule = () => {
    if (!securityRuleForm.name || !securityRuleForm.port || !securityRuleForm.ip) {
      showToast('All fields are required', 'danger');
      return;
    }
    
    const newRule = {
      id: Date.now(),
      ...securityRuleForm
    };
    
    const newRules = [...config.firewall.portForwarding, newRule];
    updateConfig('firewall', 'portForwarding', newRules);
    setIsSecurityRuleModalOpen(false);
    showToast('Port forwarding rule added', 'success');
  };

  const deleteSecurityRule = (id) => {
      const newRules = config.firewall.portForwarding.filter(r => r.id !== id);
      updateConfig('firewall', 'portForwarding', newRules);
      showToast('Rule deleted', 'info');
  };

  const startScenario = (scenario) => {
      const newConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      scenario.setup(newConfig);
      setConfig(newConfig);
      setActiveScenario(scenario);
      setScenarioSolved(false);
      showToast(`Scenario Started: ${scenario.title}`, 'danger');
      setActiveTab('dashboard');
  };

  const exitScenario = () => {
      setActiveScenario(null);
      setScenarioSolved(false);
      setConfig(DEFAULT_CONFIG);
      showToast('Exited troubleshooting mode. Restored defaults.', 'info');
  };

  // --- CHART RENDERER (SVG) ---
  const TrafficChart = ({ data }) => {
     const width = 100;
     const height = 40;
     const maxVal = 200; // Mbps scaling
     
     const pointsDown = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - (d.down / maxVal) * height}`).join(' ');
     const pointsUp = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - (d.up / maxVal) * height}`).join(' ');

     return (
        <svg className="w-full h-24 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
           {/* Download Area */}
           <defs>
             <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#4ade80" stopOpacity="0.5" />
               <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
             </linearGradient>
             <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
               <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
             </linearGradient>
           </defs>
           
           <path d={`M 0,${height} ${pointsDown} L ${width},${height} Z`} fill="url(#gradDown)" />
           <polyline points={pointsDown} fill="none" stroke="#22c55e" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
           
           <path d={`M 0,${height} ${pointsUp} L ${width},${height} Z`} fill="url(#gradUp)" />
           <polyline points={pointsUp} fill="none" stroke="#3b82f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
     );
  };

  // --- RENDERERS ---

  const renderDashboard = () => {
    // Calculate client stats for dashboard
    const onlineClients = clients.filter(c => c.status === 'online');
    const wiredCount = onlineClients.filter(c => c.type === 'ethernet').length;
    const wifiCount = onlineClients.filter(c => c.type === 'wifi').length;

    return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {activeScenario && (
          <div className="col-span-1 lg:col-span-12 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4 rounded-r shadow-sm">
              <div className="flex items-center justify-between">
                  <div>
                      <h3 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
                          <AlertOctagon className="w-5 h-5"/> Troubleshooting: {activeScenario.title}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{activeScenario.description}</p>
                  </div>
                  {scenarioSolved ? (
                      <Button variant="success" onClick={exitScenario} icon={CheckCircle}>Finish & Exit</Button>
                  ) : (
                      <div className="flex items-center gap-4">
                        <div className="text-red-600 font-bold animate-pulse text-sm uppercase tracking-wider">Fix Pending...</div>
                        <button 
                          onClick={exitScenario} 
                          className="text-red-400 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors p-1"
                          title="Exit Troubleshooting Mode"
                        >
                          <X size={20} />
                        </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Top Row: Hero Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><Globe size={120} /></div>
                <div className="relative z-10">
                    <p className="text-blue-100 text-sm font-medium mb-1">Internet Status</p>
                    <h3 className="text-2xl xl:text-3xl font-bold flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-400" /> Connected</h3>
                </div>
                <div className="relative z-10 mt-4">
                    <div className="flex flex-col gap-2 text-xs font-mono bg-black/20 p-3 rounded-lg w-full">
                      <div className="flex justify-between border-b border-white/10 pb-1 mb-1">
                          <span className="opacity-50 uppercase">WAN IP</span> 
                          <span>{config.wan.ip}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="opacity-50 uppercase">Gateway</span> 
                          <span>{config.wan.gateway}</span>
                      </div>
                    </div>
                </div>
              </div>

              <div className="md:col-span-1 xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div className="w-full">
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Real-time Throughput</p>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Download</span>
                              </div>
                              <div className="text-2xl xl:text-3xl font-bold dark:text-white tabular-nums tracking-tight">
                                  {formatBytes(trafficHistory[trafficHistory.length-1].down * 1024 * 1024 / 8)}/s
                              </div>
                          </div>
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Upload</span>
                              </div>
                              <div className="text-2xl xl:text-3xl font-bold dark:text-white tabular-nums tracking-tight">
                                  {formatBytes(trafficHistory[trafficHistory.length-1].up * 1024 * 1024 / 8)}/s
                              </div>
                          </div>
                      </div>
                    </div>
                    <Activity className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-2 h-24">
                    <TrafficChart data={trafficHistory} />
                </div>
              </div>
          </div>

          {/* Second Row: LAN & Wireless Summary (NEW) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LAN Status Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      <Share2 size={18} className="text-indigo-500"/> LAN Status
                  </h4>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Gateway IP</span>
                          <span className="font-mono text-sm font-medium dark:text-white">{config.lan.ip}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Subnet Mask</span>
                          <span className="font-mono text-sm font-medium dark:text-white">{config.lan.subnet}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-300">DHCP Server</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.lan.dhcpEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600'}`}>
                              {config.lan.dhcpEnabled ? 'ACTIVE' : 'DISABLED'}
                          </span>
                      </div>
                  </div>
              </div>

              {/* Wireless & Client Summary Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      <Wifi size={18} className="text-blue-500"/> Wireless & Clients
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-900/50">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{wifiCount}</div>
                          <div className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium uppercase tracking-wide">Wi-Fi Users</div>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-center border border-emerald-100 dark:border-emerald-900/50">
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{wiredCount}</div>
                          <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium uppercase tracking-wide">Ethernet</div>
                      </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Active SSID</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={config.wireless.ssid}>{config.wireless.ssid}</span>
                       </div>
                       <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-400 font-mono">{config.wireless.band}</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Side Stats */}
      <div className="lg:col-span-4 grid grid-cols-1 gap-6">
         <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Deep Packet Inspection (DPI)</h4>
            <div className="flex items-center gap-6">
               <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                     <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                     {/* Web Segment (Blue) */}
                     <path stroke="#3b82f6" strokeDasharray={`${dpiData.web}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3.8" />
                     {/* Media Segment (Purple) */}
                     <path stroke="#a855f7" strokeDasharray={`${dpiData.streaming}, 100`} strokeDashoffset={`-${dpiData.web}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3.8" />
                     {/* Gaming Segment (Orange) */}
                     <path stroke="#f97316" strokeDasharray={`${dpiData.gaming}, 100`} strokeDashoffset={`-${dpiData.web + dpiData.streaming}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3.8" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">LIVE</div>
               </div>
               <div className="text-xs space-y-2 flex-1">
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Web</div> <span>{Math.round(dpiData.web)}%</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Media</div> <span>{Math.round(dpiData.streaming)}%</span></div>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Gaming</div> <span>{Math.round(dpiData.gaming)}%</span></div>
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-center mb-4">
                 <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">System Load</h4>
                 <div className="text-xs text-slate-400 font-mono">
                    Uptime: {Math.floor(uptime / 86400)}d {Math.floor((uptime % 86400) / 3600)}h {Math.floor((uptime % 3600) / 60)}m {Math.floor(uptime % 60)}s
                 </div>
             </div>
             <div className="space-y-4">
                 <div>
                     <div className="flex justify-between text-xs mb-1 dark:text-slate-300">
                        <span>CPU (Quad-Core)</span> 
                        <span className="font-mono">{Math.round(systemStats.cpu)}%</span>
                     </div>
                     <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${systemStats.cpu > 80 ? 'bg-red-500' : 'bg-blue-600'}`} 
                            style={{width: `${systemStats.cpu}%`}}
                        ></div>
                     </div>
                 </div>
                 <div>
                     <div className="flex justify-between text-xs mb-1 dark:text-slate-300">
                        <span>RAM (2GB)</span> 
                        <span className="font-mono">{Math.round(systemStats.mem)}%</span>
                     </div>
                     <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500" 
                            style={{width: `${systemStats.mem}%`}}
                        ></div>
                     </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
  };

  const renderNetwork = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card title="WAN Settings (Internet)">
        <Select 
          label="Connection Type" 
          options={[{label: 'Dynamic IP (DHCP)', value: 'dhcp'}, {label: 'Static IP', value: 'static'}, {label: 'PPPoE', value: 'pppoe'}]}
          value={config.wan.type}
          onChange={(e) => updateConfig('wan', 'type', e.target.value)}
        />
        
        {config.wan.type === 'static' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mb-4">
            <Input label="IP Address" value={config.wan.ip} onChange={(e) => updateConfig('wan', 'ip', e.target.value)} />
            <Input label="Gateway" value={config.wan.gateway} onChange={(e) => updateConfig('wan', 'gateway', e.target.value)} />
            <Input label="Primary DNS" value={config.wan.dns === 'auto' ? '8.8.8.8' : config.wan.dns} onChange={(e) => updateConfig('wan', 'dns', e.target.value)} />
            <Input label="Secondary DNS" value="1.1.1.1" onChange={() => {}} />
          </div>
        )}

        {config.wan.type === 'pppoe' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mb-4">
             <Input label="Username" value={config.wan.username} onChange={(e) => updateConfig('wan', 'username', e.target.value)} />
             <Input label="Password" type="password" value={config.wan.password} onChange={(e) => updateConfig('wan', 'password', e.target.value)} />
          </div>
        )}

        {/* Advanced WAN Options */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Advanced Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="MTU Size (Bytes)" value={config.wan.mtu} onChange={(e) => updateConfig('wan', 'mtu', e.target.value)} placeholder="1500" />
                <div>
                    <Toggle label="MAC Address Clone" subLabel="Use custom MAC for ISP binding" enabled={config.wan.macClone} onChange={(v) => updateConfig('wan', 'macClone', v)} />
                    {config.wan.macClone && (
                        <div className="mt-2 animate-fade-in">
                            <Input label="Custom MAC Address" value={config.wan.clonedMac} onChange={(e) => updateConfig('wan', 'clonedMac', e.target.value)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
             <Toggle label="Enable IPv6 Stack" subLabel="Dual-stack operation for next-gen connectivity" enabled={config.wan.ipv6Enabled} onChange={(v) => updateConfig('wan', 'ipv6Enabled', v)} />
             {config.wan.ipv6Enabled && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-fade-in">
                     <Input label="IPv6 Address" value={config.wan.ipv6Address} onChange={(e) => updateConfig('wan', 'ipv6Address', e.target.value)} />
                     <Input label="IPv6 Gateway" value={config.wan.ipv6Gateway} onChange={(e) => updateConfig('wan', 'ipv6Gateway', e.target.value)} />
                 </div>
             )}
        </div>
      </Card>

      <Card title="LAN Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Router IP Address" value={config.lan.ip} onChange={(e) => updateConfig('lan', 'ip', e.target.value)} />
          <Input label="Subnet Mask" value={config.lan.subnet} onChange={(e) => updateConfig('lan', 'subnet', e.target.value)} />
        </div>
        
        <div className="mt-4">
            <Toggle label="IGMP Snooping" subLabel="Optimize multicast traffic for IPTV" enabled={config.lan.igmpSnooping} onChange={(v) => updateConfig('lan', 'igmpSnooping', v)} />
        </div>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-6">
          <Toggle label="DHCP Server" enabled={config.lan.dhcpEnabled} onChange={(v) => updateConfig('lan', 'dhcpEnabled', v)} />
          {config.lan.dhcpEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fade-in">
              <Input label="Start IP Address" value={config.lan.dhcpStart} onChange={(e) => updateConfig('lan', 'dhcpStart', e.target.value)} />
              <Input label="End IP Address" value={config.lan.dhcpEnd} onChange={(e) => updateConfig('lan', 'dhcpEnd', e.target.value)} />
              <Input label="Address Lease Time (Minutes)" value={config.lan.leaseTime} onChange={(e) => updateConfig('lan', 'leaseTime', e.target.value)} />
              <Input label="Gateway (Optional)" placeholder={config.lan.ip} value="" onChange={() => {}} />
            </div>
          )}
        </div>
      </Card>

      <Card title="Dynamic DNS (DDNS)">
         <Toggle label="Enable DDNS" subLabel="Remote access via domain name" enabled={config.ddns.enabled} onChange={(v) => updateConfig('ddns', 'enabled', v)} />
         {config.ddns.enabled && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fade-in">
                 <Select 
                    label="Service Provider" 
                    value={config.ddns.provider} 
                    onChange={(e) => updateConfig('ddns', 'provider', e.target.value)}
                    options={[{label: 'No-IP', value: 'noip'}, {label: 'DynDNS', value: 'dyndns'}, {label: 'Custom', value: 'custom'}]} 
                 />
                 <Input label="Domain Name" placeholder="example.ddns.net" value={config.ddns.hostname} onChange={(e) => updateConfig('ddns', 'hostname', e.target.value)} />
                 <Input label="Username" value={config.ddns.username} onChange={(e) => updateConfig('ddns', 'username', e.target.value)} />
                 <Input label="Password" type="password" value={config.ddns.password} onChange={(e) => updateConfig('ddns', 'password', e.target.value)} />
             </div>
         )}
      </Card>
      
      <Card title="VLAN Configuration (802.1Q)">
         <Toggle label="Enable VLANs" enabled={config.vlan.enabled} onChange={(v) => updateConfig('vlan', 'enabled', v)} />
         {config.vlan.enabled && (
             <div className="mt-4 overflow-x-auto">
                 <table className="min-w-full text-sm text-left">
                     <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-medium">
                         <tr>
                             <th className="px-4 py-2">Port</th>
                             <th className="px-4 py-2">VLAN ID</th>
                             <th className="px-4 py-2">Mode</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {config.vlan.ports.map((port, idx) => (
                             <tr key={port.id}>
                                 <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">LAN {port.id}</td>
                                 <td className="px-4 py-2">
                                     <input 
                                       type="number" 
                                       className="w-16 px-2 py-1 border rounded bg-transparent dark:text-white dark:border-slate-600"
                                       value={port.vlanId} 
                                       onChange={(e) => {
                                           const newPorts = [...config.vlan.ports];
                                           newPorts[idx].vlanId = parseInt(e.target.value);
                                           updateConfig('vlan', 'ports', newPorts);
                                       }}
                                     />
                                 </td>
                                 <td className="px-4 py-2">
                                     <select 
                                       className="px-2 py-1 border rounded bg-transparent dark:text-white dark:border-slate-600"
                                       value={port.type}
                                       onChange={(e) => {
                                           const newPorts = [...config.vlan.ports];
                                           newPorts[idx].type = e.target.value;
                                           updateConfig('vlan', 'ports', newPorts);
                                       }}
                                     >
                                         <option value="untagged">Untagged (Access)</option>
                                         <option value="tagged">Tagged (Trunk)</option>
                                     </select>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         )}
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} icon={Save}>Save Network Settings</Button>
      </div>
    </div>
  );

  const renderWireless = () => {
    const getCurvePath = (channel, strength) => {
       const height = 200 - (strength * 1.8); 
       const startX = (channel * 65) - 60;
       const peakX = (channel * 65) + 20;
       const endX = (channel * 65) + 100;
       return `M ${startX},200 Q ${peakX},${height} ${endX},200`;
    };

    return (
    <div className="space-y-6 max-w-4xl mx-auto">
       <Card title="Wi-Fi Channel Analyzer">
          <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Your Network</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Neighbors</span>
             </div>
             <div className="text-xs text-slate-400 animate-pulse">Scanning airwaves...</div>
          </div>
          <div className="relative h-48 w-full bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 mt-2 overflow-hidden">
             <div className="absolute bottom-0 w-full flex justify-between px-4 text-xs text-slate-400 font-mono z-10 pointer-events-none">
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(c => <span key={c}>{c}</span>)}
             </div>
             <svg className="absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out" viewBox="0 0 1000 200" preserveAspectRatio="none">
                 {/* Neighbor Signals */}
                 {wifiNeighbors.map(n => (
                    <g key={n.id}>
                       <path 
                          d={getCurvePath(n.channel, n.strength)} 
                          fill={`${n.color}33`} 
                          stroke={n.color} 
                          strokeWidth="2" 
                          className="transition-all duration-700 ease-in-out"
                       />
                       <text 
                          x={(n.channel * 65) + 20} 
                          y={200 - (n.strength * 1.8) - 10} 
                          fill={n.color} 
                          fontSize="10" 
                          textAnchor="middle"
                          className="transition-all duration-700 ease-in-out"
                       >
                          {n.name}
                       </text>
                    </g>
                 ))}

                 {/* User Signal */}
                 {config.wireless.enabled && (
                     <g>
                        <path 
                          d={getCurvePath(config.wireless.channel === 'auto' ? 6 : parseInt(config.wireless.channel), userSignalStrength)} 
                          fill="rgba(34, 197, 94, 0.4)" 
                          stroke="#22c55e" 
                          strokeWidth="3"
                          className="transition-all duration-500 ease-in-out"
                        />
                        <text 
                           x={((config.wireless.channel === 'auto' ? 6 : parseInt(config.wireless.channel)) * 65) + 20} 
                           y={200 - (userSignalStrength * 1.8) - 15} 
                           fill="#16a34a" 
                           fontSize="12" 
                           fontWeight="bold"
                           textAnchor="middle"
                           className="transition-all duration-500 ease-in-out"
                        >
                           {config.wireless.ssid}
                        </text>
                     </g>
                 )}
             </svg>
          </div>
          <p className="text-xs text-slate-500 mt-2">
             Real-time analysis. 
             {wifiNeighbors.some(n => n.channel === (config.wireless.channel === 'auto' ? 6 : parseInt(config.wireless.channel))) 
               ? <span className="text-red-500 font-medium ml-1 flex items-center gap-1 inline-flex"><AlertTriangle size={12}/> High interference detected on current channel!</span> 
               : <span className="text-green-600 font-medium ml-1 flex items-center gap-1 inline-flex"><CheckCircle size={12}/> Current channel looks clear.</span>
             }
          </p>
       </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Main Network">
            <Toggle label="Enable Wireless Radio" enabled={config.wireless.enabled} onChange={(v) => updateConfig('wireless', 'enabled', v)} />
            <div className={`mt-4 space-y-4 transition-opacity ${!config.wireless.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
               <Input label="Network Name (SSID)" value={config.wireless.ssid} onChange={(e) => updateConfig('wireless', 'ssid', e.target.value)} />
               <Select 
                   label="Security Mode" 
                   value={config.wireless.security} 
                   onChange={(e) => updateConfig('wireless', 'security', e.target.value)}
                   options={[{label: 'No Security', value: 'none'}, {label: 'WPA2-PSK (AES)', value: 'wpa2'}, {label: 'WPA3-SAE', value: 'wpa3'}]} 
                 />
               {config.wireless.security !== 'none' && (
                 <Input type="password" label="Wireless Password" value={config.wireless.password} onChange={(e) => updateConfig('wireless', 'password', e.target.value)} />
               )}
            </div>
          </Card>

          <Card title="Guest Network">
             <Toggle label="Enable Guest Network" subLabel="Isolate guests from main LAN" enabled={config.wireless.guestEnabled} onChange={(v) => updateConfig('wireless', 'guestEnabled', v)} />
             <div className={`mt-4 space-y-4 transition-opacity ${!config.wireless.guestEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <Input label="Guest SSID" value={config.wireless.guestSsid} onChange={(e) => updateConfig('wireless', 'guestSsid', e.target.value)} />
                <Input type="password" label="Guest Password" value={config.wireless.guestPassword} onChange={(e) => updateConfig('wireless', 'guestPassword', e.target.value)} />
                <Toggle label="AP Isolation" subLabel="Prevent guests from seeing each other" enabled={config.wireless.guestIsolation} onChange={(v) => updateConfig('wireless', 'guestIsolation', v)} />
             </div>
          </Card>
      </div>

      <div className="flex justify-end"><Button onClick={handleSave} icon={Save}>Save Wireless Settings</Button></div>
    </div>
  );
  };

  const renderClients = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Rule Editor Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                {currentRuleId ? <Edit2 size={18}/> : <Plus size={18}/>} 
                {currentRuleId ? 'Edit Access Rule' : 'Add Access Rule'}
              </h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <Input 
                label="Device Name" 
                value={ruleForm.name} 
                onChange={e => setRuleForm({...ruleForm, name: e.target.value})} 
                placeholder="e.g. Kid's iPad" 
              />
              <Input 
                label="MAC Address" 
                value={ruleForm.mac} 
                onChange={e => setRuleForm({...ruleForm, mac: e.target.value})} 
                placeholder="AA:BB:CC:DD:EE:FF" 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Start Time" 
                  type="time" 
                  value={ruleForm.startTime} 
                  onChange={e => setRuleForm({...ruleForm, startTime: e.target.value})} 
                />
                <Input 
                  label="End Time" 
                  type="time" 
                  value={ruleForm.endTime} 
                  onChange={e => setRuleForm({...ruleForm, endTime: e.target.value})} 
                />
              </div>
              <Input 
                label="Blocked Domains (Comma separated)" 
                value={ruleForm.blockedDomains} 
                onChange={e => setRuleForm({...ruleForm, blockedDomains: e.target.value})} 
                placeholder="e.g. tiktok.com, roblox.com" 
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setIsRuleModalOpen(false)}>Cancel</Button>
              <Button onClick={saveRule}>{currentRuleId ? 'Save Changes' : 'Create Rule'}</Button>
            </div>
          </div>
        </div>
      )}

      <Card title="Client List & Access Control">
        <div className="mb-4 flex gap-2">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
             <input className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-sm dark:text-white" placeholder="Search by name, IP or MAC..." />
           </div>
           <Button variant="secondary" icon={RefreshCw} onClick={() => {}}>Refresh</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP/MAC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {clients.map(client => (
                <tr key={client.id}>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${client.type === 'wifi' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                           {client.type === 'wifi' ? <Wifi size={16}/> : <Server size={16}/>}
                        </div>
                        <div>
                           <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{client.name}</div>
                           <div className="text-xs text-slate-500">{client.status}</div>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-sm text-slate-500 dark:text-slate-400">{client.ip}</div>
                     <div className="text-xs font-mono text-slate-400">{client.mac}</div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 mb-1">
                        Current: {!client.blocked && client.status === 'online' ? Math.floor(Math.random()*10) : 0} Mbps
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${client.blocked ? 'bg-slate-300 w-0' : 'bg-blue-500'}`} 
                          style={{width: `${!client.blocked && client.status === 'online' ? Math.random()*100 : 0}%`}}
                        ></div>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium">
                    <button 
                      onClick={() => {
                        const newClients = clients.map(c => c.id === client.id ? {...c, blocked: !c.blocked} : c);
                        setClients(newClients);
                        showToast(`${client.name} ${!client.blocked ? 'blocked' : 'unblocked'}`, !client.blocked ? 'danger' : 'success');
                      }}
                      className={`${client.blocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                    >
                      {client.blocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <Card title="Parental Controls & Scheduling">
         <div className="flex justify-between items-center mb-4">
            <Toggle label="Enable Parental Control" enabled={config.parental.enabled} onChange={(v) => updateConfig('parental', 'enabled', v)} />
            <Button 
                variant="secondary" 
                icon={Plus} 
                className="h-8 text-xs"
                onClick={openAddRuleModal}
            >
                Add Rule
            </Button>
         </div>
         {config.parental.enabled && (
             <div className="space-y-3">
                 {config.parental.rules.map(rule => (
                     <div key={rule.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                         <div className="flex justify-between items-start">
                             <div>
                                 <div className="font-bold text-slate-700 dark:text-slate-200">{rule.name}</div>
                                 <div className="text-xs text-slate-500 font-mono mt-0.5">{rule.mac}</div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                    className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"
                                    onClick={() => openEditRuleModal(rule)}
                                    title="Edit Rule"
                                >
                                    <Edit2 className="h-4 w-4"/>
                                </button>
                                <button 
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-slate-700 rounded"
                                    onClick={() => {
                                        const updatedRules = config.parental.rules.filter(r => r.id !== rule.id);
                                        updateConfig('parental', 'rules', updatedRules);
                                        showToast('Rule deleted', 'info');
                                    }}
                                    title="Delete Rule"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                             </div>
                         </div>
                         <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                             <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                 <Clock className="h-4 w-4"/>
                                 <span>{rule.startTime} - {rule.endTime}</span>
                             </div>
                             <div className="flex items-center gap-2 text-red-500">
                                 <Lock className="h-4 w-4"/>
                                 <span>Blocked: {rule.blockedDomains}</span>
                             </div>
                         </div>
                     </div>
                 ))}
                 {config.parental.rules.length === 0 && (
                     <div className="text-center py-4 text-slate-400 text-sm">No rules active. Click "Add Rule" to create one.</div>
                 )}
             </div>
         )}
      </Card>
    </div>
  );

  const renderStorage = () => (
     <div className="max-w-5xl mx-auto space-y-6">
        <Card title="USB Storage & File Sharing">
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-blue-100 text-blue-600 rounded-lg"><HardDrive size={32} /></div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{config.storage.name}</h3>
                    <p className="text-sm text-slate-500">File System: NTFS</p>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-2xl font-bold text-slate-800 dark:text-white">{formatBytes(config.storage.used, 0)} <span className="text-sm font-normal text-slate-500">used of {formatBytes(config.storage.total, 0)}</span></div>
              </div>
           </div>
           <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
               <div className="h-full bg-blue-500 w-[45%]"></div>
           </div>
           
           <div className="mt-8">
              <h4 className="font-medium mb-4 text-slate-700 dark:text-slate-300 border-b pb-2 dark:border-slate-700">File Explorer</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {MOCK_FILES.map((file, i) => (
                    <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group">
                       <div className="mb-2 text-slate-400 group-hover:text-blue-500">
                          {file.type === 'folder' ? <Folder size={40} className="fill-current"/> : file.name.endsWith('jpg') ? <ImageIcon size={40}/> : <FileText size={40}/>}
                       </div>
                       <div className="truncate font-medium text-sm text-slate-700 dark:text-slate-300">{file.name}</div>
                       <div className="text-xs text-slate-400 mt-1">{file.type === 'folder' ? '-' : formatBytes(file.size)}</div>
                    </div>
                 ))}
                 <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer">
                    <Plus size={24} />
                    <span className="text-xs mt-2">Upload</span>
                 </div>
              </div>
           </div>
        </Card>
     </div>
  );

  const renderVPN = () => (
    <div className="max-w-4xl mx-auto space-y-6">
        <Card title="VPN Server Configuration">
            <Toggle label="Enable VPN Server" enabled={config.vpn.enabled} onChange={(v) => updateConfig('vpn', 'enabled', v)} />
            {config.vpn.enabled && (
                <div className="mt-6 space-y-6 animate-fade-in">
                    <Select 
                      label="VPN Protocol"
                      value={config.vpn.type}
                      onChange={(e) => updateConfig('vpn', 'type', e.target.value)}
                      options={[{label: 'WireGuard (Recommended)', value: 'wireguard'}, {label: 'OpenVPN', value: 'openvpn'}]}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Listen Port" value={config.vpn.port} onChange={(e) => updateConfig('vpn', 'port', e.target.value)} />
                        <Input label="Virtual Subnet" value={config.vpn.subnet} onChange={(e) => updateConfig('vpn', 'subnet', e.target.value)} />
                    </div>
                    
                    <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                        <div className="flex justify-between mb-2 text-slate-400">
                            <span>Client Configuration</span>
                            <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1"><Download className="h-3 w-3"/> Download .conf</button>
                        </div>
                        {config.vpn.type === 'wireguard' ? (
                            <pre>{`[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY>
Address = 10.8.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = ${config.wan.ip}:${config.vpn.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`}</pre>
                        ) : (
                            <pre>{`client
dev tun
proto udp
remote ${config.wan.ip} ${config.vpn.port}
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert client.crt
key client.key`}</pre>
                        )}
                    </div>
                </div>
            )}
        </Card>
    </div>
  );

  const renderSecurity = () => (
     <div className="space-y-6 max-w-4xl mx-auto">
        {/* Security Rule Modal */}
        {isSecurityRuleModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus size={18}/> Add Port Forwarding Rule
                </h3>
                <button onClick={() => setIsSecurityRuleModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <X size={20} />
                </button>
                </div>
                <div className="p-6 space-y-4">
                <Input 
                    label="Service Name" 
                    value={securityRuleForm.name} 
                    onChange={e => setSecurityRuleForm({...securityRuleForm, name: e.target.value})} 
                    placeholder="e.g. Web Server" 
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                    label="External Port" 
                    value={securityRuleForm.port} 
                    onChange={e => setSecurityRuleForm({...securityRuleForm, port: e.target.value})} 
                    placeholder="80" 
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Protocol</label>
                        <select
                        value={securityRuleForm.protocol}
                        onChange={e => setSecurityRuleForm({...securityRuleForm, protocol: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white"
                        >
                        <option value="TCP">TCP</option>
                        <option value="UDP">UDP</option>
                        <option value="TCP/UDP">TCP/UDP</option>
                        </select>
                    </div>
                </div>
                <Input 
                    label="Internal IP" 
                    value={securityRuleForm.ip} 
                    onChange={e => setSecurityRuleForm({...securityRuleForm, ip: e.target.value})} 
                    placeholder="192.168.1.X" 
                />
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <Button variant="secondary" onClick={() => setIsSecurityRuleModalOpen(false)}>Cancel</Button>
                <Button onClick={saveSecurityRule}>Add Rule</Button>
                </div>
            </div>
            </div>
        )}

        <Card title="Firewall Configuration">
           <Toggle label="Enable SPI Firewall" enabled={config.firewall.enabled} onChange={(v) => updateConfig('firewall', 'enabled', v)} />
           <Toggle label="DoS Protection" enabled={config.firewall.ddosProtection} onChange={(v) => updateConfig('firewall', 'ddosProtection', v)} />
           <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
             <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-4">Port Forwarding</h4>
             <div className="grid grid-cols-5 gap-2 mb-2 text-xs font-bold text-slate-500 uppercase">
                <div className="col-span-1">Service</div>
                <div>Ext. Port</div>
                <div className="col-span-2">Internal IP</div>
                <div className="text-right pr-8">Protocol</div>
             </div>
             {config.firewall.portForwarding.map((rule, idx) => (
               <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-center text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                  <div className="col-span-1 font-medium">{rule.name}</div>
                  <div>{rule.port}</div>
                  <div className="col-span-2 font-mono text-xs">{rule.ip}</div>
                  <div className="flex justify-between items-center">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{rule.protocol}</span>
                      <button 
                        onClick={() => deleteSecurityRule(rule.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Rule"
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
               </div>
             ))}
             <div className="mt-4">
                <Button variant="secondary" onClick={openAddSecurityRuleModal} icon={Plus}>Add New Rule</Button>
             </div>
           </div>
        </Card>
        <div className="flex justify-end"><Button onClick={handleSave} icon={Save}>Apply Security Settings</Button></div>
     </div>
  );

  const renderTools = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card title="Troubleshooting Scenarios (Game Mode)">
          <div className="grid grid-cols-1 gap-4">
              {SCENARIOS.map(sc => (
                  <div key={sc.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-slate-800" onClick={() => startScenario(sc)}>
                      <div className="flex justify-between items-center">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{sc.title}</h4>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Start</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{sc.description}</p>
                  </div>
              ))}
          </div>
      </Card>

      <Card title="System Tools">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <h4 className="font-medium text-slate-800 dark:text-slate-200">Configuration</h4>
               <Button variant="secondary" className="w-full justify-center" icon={Download} onClick={() => {
                   const blob = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'});
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a'); a.href = url; a.download = `backup-${config.system.hostname}.json`; a.click();
                   showToast('Configuration downloaded', 'success');
               }}>Backup Configuration</Button>
               <Button variant="secondary" className="w-full justify-center" icon={Upload} onClick={() => showToast('Simulated: Upload Prompt', 'info')}>Restore Configuration</Button>
            </div>
            <div className="space-y-4">
               <h4 className="font-medium text-slate-800 dark:text-slate-200">Operations</h4>
               <Button variant="danger" className="w-full justify-center" icon={RefreshCw} onClick={() => setRebooting(true)}>Reboot Router</Button>
               <Button variant="danger" className="w-full justify-center" icon={AlertTriangle} onClick={() => {setConfig(DEFAULT_CONFIG); showToast('Reset to Factory Defaults', 'success'); setRebooting(true);}}>Factory Reset</Button>
            </div>
         </div>
      </Card>

      <Card title="Admin Account Settings">
         <div className="max-w-lg">
            <h4 className="text-sm font-medium text-slate-500 mb-4 dark:text-slate-400">Change Administrator Password</h4>
            <div className="space-y-2">
               <Input 
                 label="Current Password" 
                 type="password" 
                 placeholder="••••••" 
                 value={passwordForm.current} 
                 onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} 
               />
               <Input 
                 label="New Password" 
                 type="password" 
                 placeholder="New Password" 
                 value={passwordForm.new} 
                 onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} 
               />
               <Input 
                 label="Confirm Password" 
                 type="password" 
                 placeholder="Confirm New Password" 
                 value={passwordForm.confirm} 
                 onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} 
               />
               <div className="flex justify-end pt-2">
                  <Button onClick={() => {
                    setPasswordForm({ current: '', new: '', confirm: '' });
                    showToast('Password updated successfully', 'success');
                  }}>Update Password</Button>
               </div>
            </div>
         </div>
      </Card>
      
      <Card title="CLI Terminal">
        <TerminalCLI 
          config={config} 
          updateConfig={updateConfig} 
          setRebooting={setRebooting}
          onFactoryReset={() => {
             setConfig(DEFAULT_CONFIG);
             showToast('Reset to Factory Defaults', 'success');
             setRebooting(true);
          }}
        />
      </Card>
    </div>
  );

  const renderTopology = () => {
    // Handling Drag Logic (Simplified for brevity)
    const handleDragStart = (key, id) => setDraggingNode({ key, id });
    const handleDragEnd = () => setDraggingNode(null);
    const handleMouseMove = (e) => {
        if (!draggingNode || !mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        setNodes(prev => {
           if (draggingNode.key === 'clients') {
               const newClients = prev.clients.map(c => c.id === draggingNode.id ? { ...c, x, y } : c);
               return { ...prev, clients: newClients };
           }
           return { ...prev, [draggingNode.key]: { x, y } };
        });
    };

    const renderNodeDetail = () => {
        if (!hoveredNode) return null;
        
        // Find data based on type
        let detailData = null;
        let title = '';
        let icon = null;
        let position = { x: 0, y: 0 };

        if (hoveredNode.type === 'internet') {
            detailData = config.wan;
            title = 'Internet (WAN)';
            icon = <Globe size={16} className="text-blue-500" />;
            position = nodes.internet;
        } else if (hoveredNode.type === 'router') {
            detailData = config.system;
            title = config.system.hostname;
            icon = <Cpu size={16} className="text-indigo-500" />;
            position = nodes.router;
        } else if (hoveredNode.type === 'clients') {
            detailData = clients.find(c => c.id === hoveredNode.id);
            title = detailData.name;
            icon = detailData.type === 'wifi' ? <Smartphone size={16} className="text-blue-500" /> : <Laptop size={16} className="text-emerald-500" />;
            // Find client position
            const clientNode = nodes.clients.find(c => c.id === hoveredNode.id);
            position = clientNode;
        }

        // Calculate card position styles - centering above the node
        const style = {
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -125%)'
        };

        return (
            <div className="absolute z-50 w-64 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-left pointer-events-none animate-fade-in-up" style={style}>
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                    {icon} {title}
                </h4>
                <div className="space-y-2 text-xs">
                    {hoveredNode.type === 'internet' && (
                        <>
                            <div className="flex justify-between"><span className="text-slate-500">IP Address</span> <span className="font-mono text-slate-700 dark:text-slate-300">{detailData.ip}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Gateway</span> <span className="font-mono text-slate-700 dark:text-slate-300">{detailData.gateway}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Connection</span> <span className="uppercase text-slate-700 dark:text-slate-300">{detailData.type}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">DNS</span> <span className="text-slate-700 dark:text-slate-300">{detailData.dns}</span></div>
                        </>
                    )}
                    {hoveredNode.type === 'router' && (
                        <>
                            <div className="flex justify-between"><span className="text-slate-500">LAN IP</span> <span className="font-mono text-slate-700 dark:text-slate-300">{config.lan.ip}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Uptime</span> <span className="text-slate-700 dark:text-slate-300">{Math.floor(uptime / 3600)}h {(uptime % 60)}s</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Firmware</span> <span className="text-slate-700 dark:text-slate-300">{detailData.firmware}</span></div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{width: `${detailData.cpuLoad}%`}}></div>
                            </div>
                            <div className="text-[10px] text-right text-slate-400">CPU Load</div>
                        </>
                    )}
                    {hoveredNode.type === 'clients' && (
                        <>
                            <div className="flex justify-between"><span className="text-slate-500">IP Address</span> <span className="font-mono text-slate-700 dark:text-slate-300">{detailData.ip}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">MAC</span> <span className="font-mono text-slate-700 dark:text-slate-300">{detailData.mac}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Status</span> <span className={detailData.status === 'online' ? 'text-green-500' : 'text-slate-400'}>{detailData.status}</span></div>
                            {detailData.status === 'online' && !detailData.blocked && (
                                <div className="flex justify-between"><span className="text-slate-500">Usage</span> <span className="text-blue-500">{detailData.usage || Math.floor(Math.random()*20)} Mbps</span></div>
                            )}
                        </>
                    )}
                </div>
                {/* Little triangle pointer */}
                <div className="absolute left-1/2 bottom-0 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 transform translate-y-1/2 -translate-x-1/2 rotate-45"></div>
            </div>
        );
    };

    return (
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <Card title="Interactive Topology Map" className="flex-1 min-h-[600px] relative overflow-hidden bg-slate-100 dark:bg-slate-900/50" noPadding>
          <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 z-10 text-xs space-y-2">
             <div className="font-bold mb-1 text-slate-700 dark:text-slate-300">Legend</div>
             <div className="flex items-center gap-2"><div className="w-8 h-1 bg-emerald-500 rounded-full"></div><span className="text-slate-500">Ethernet</span></div>
             <div className="flex items-center gap-2"><div className="w-8 h-1 border-t-2 border-dashed border-blue-400"></div><span className="text-slate-500">Wi-Fi</span></div>
             <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2">Hover nodes for details</div>
          </div>
          
          <div className="relative w-full h-full min-h-[600px]" ref={mapRef}>
             {/* Render Detail Popover */}
             {renderNodeDetail()}

             {/* SVG Layer with ViewBox for Percentage Coordinates */}
             <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                   <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#64748b" stopOpacity="0.8" />
                   </linearGradient>
                </defs>

                {/* Internet to Router Connection */}
                <path 
                   d={`M ${nodes.internet.x} ${nodes.internet.y} C ${nodes.internet.x} ${(nodes.internet.y + nodes.router.y)/2}, ${nodes.router.x} ${(nodes.internet.y + nodes.router.y)/2}, ${nodes.router.x} ${nodes.router.y}`}
                   fill="none"
                   stroke="#64748b" 
                   strokeWidth="0.5" 
                   className="opacity-60"
                />
                
                {/* Router to Clients Connections */}
                {nodes.clients.map((clientNode) => {
                    const client = clients.find(c => c.id === clientNode.id);
                    const isWifi = client.type === 'wifi';
                    const strokeColor = isWifi ? '#60a5fa' : '#10b981';
                    
                    return (
                        <g key={`link-${clientNode.id}`}>
                            <path 
                                d={`M ${nodes.router.x} ${nodes.router.y} C ${nodes.router.x} ${(nodes.router.y + clientNode.y)/2}, ${clientNode.x} ${(nodes.router.y + clientNode.y)/2}, ${clientNode.x} ${clientNode.y}`}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="0.4"
                                strokeDasharray={isWifi ? "1,1" : ""} 
                                className="opacity-60 transition-all duration-300"
                            />
                            {/* Packet Animation */}
                            {client.status === 'online' && !client.blocked && (
                                <circle r="0.6" fill={strokeColor}>
                                    <animateMotion 
                                        dur={`${1.5 + Math.random()}s`} 
                                        repeatCount="indefinite" 
                                        path={`M ${nodes.router.x} ${nodes.router.y} C ${nodes.router.x} ${(nodes.router.y + clientNode.y)/2}, ${clientNode.x} ${(nodes.router.y + clientNode.y)/2}, ${clientNode.x} ${clientNode.y}`} 
                                    />
                                </circle>
                            )}
                        </g>
                    );
                })}
             </svg>

             {/* NODE: Internet */}
             <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-help z-10 flex flex-col items-center group" 
                style={{ left: `${nodes.internet.x}%`, top: `${nodes.internet.y}%` }} 
                onMouseEnter={() => setHoveredNode({ type: 'internet' })}
                onMouseLeave={() => setHoveredNode(null)}
             >
                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 group-hover:border-blue-500 transition-colors">
                    <Cloud className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Internet</div>
                    <div className="text-[10px] text-slate-400 font-mono">{config.wan.ip}</div>
                </div>
             </div>

             {/* NODE: Router */}
             <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-help z-20 flex flex-col items-center group" 
                style={{ left: `${nodes.router.x}%`, top: `${nodes.router.y}%` }} 
                onMouseEnter={() => setHoveredNode({ type: 'router' })}
                onMouseLeave={() => setHoveredNode(null)}
             >
                <div className="relative p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 group-hover:border-indigo-500 transition-colors">
                   <div className="absolute -top-1 left-4 w-1 h-3 bg-slate-300 dark:bg-slate-600 rounded-t"></div>
                   <div className="absolute -top-1 right-4 w-1 h-3 bg-slate-300 dark:bg-slate-600 rounded-t"></div>
                   <Cpu className="w-10 h-10 text-indigo-600" />
                   
                   {/* Status Dot */}
                   <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-center min-w-[120px]">
                   <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{config.system.hostname}</div>
                   <div className="text-[10px] text-slate-500">Gateway: {config.lan.ip}</div>
                </div>
             </div>

             {/* NODES: Clients */}
             {nodes.clients.map((node) => {
                 const client = clients.find(c => c.id === node.id);
                 return (
                     <div 
                        key={node.id} 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-help z-10 flex flex-col items-center group" 
                        style={{ left: `${node.x}%`, top: `${node.y}%` }} 
                        onMouseEnter={() => setHoveredNode({ type: 'clients', id: node.id })}
                        onMouseLeave={() => setHoveredNode(null)}
                     >
                        <div className={`p-2.5 rounded-xl shadow-md border transition-all duration-300 ${
                            client.blocked 
                                ? 'bg-red-50 border-red-200 grayscale' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 group-hover:-translate-y-1 group-hover:shadow-lg'
                        }`}>
                           {client.type === 'wifi' ? (
                               <Smartphone className={`w-6 h-6 ${client.status === 'online' ? 'text-blue-500' : 'text-slate-400'}`} />
                           ) : (
                               <Laptop className={`w-6 h-6 ${client.status === 'online' ? 'text-emerald-500' : 'text-slate-400'}`} />
                           )}
                        </div>
                        
                        <div className="mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                           <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{client.name}</div>
                           <div className="flex items-center justify-center gap-1 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'online' && !client.blocked ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                <div className="text-[9px] text-slate-400 font-mono">{client.ip.split('.').slice(-1)[0]}</div>
                           </div>
                        </div>
                     </div>
                 );
             })}
          </div>
        </Card>
      </div>
    );
  };

  const SidebarItem = ({ id, label, icon: Icon }) => (
    <button onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${activeTab === id ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'}`}>
      <Icon className="h-5 w-5" />{label}
    </button>
  );

  if (rebooting) return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Activity className="h-16 w-16 text-blue-500 animate-pulse mb-8" />
        <h2 className="text-2xl font-bold mb-4">Rebooting System</h2>
        <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${rebootProgress}%` }} /></div>
        <p className="mt-4 text-slate-400 font-mono">Loading modules... vlan, bridge, wifi, nas</p>
      </div>
  );

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
         {/* Toast container for login screen */}
         {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white text-sm font-medium animate-bounce-in ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'danger' ? 'bg-red-600' : 'bg-blue-600'}`}>{toast.message}</div>}
         
         <div className="absolute top-4 right-4">
            <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">{darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}</button>
         </div>

         <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-blue-600 p-8 text-center">
               <Globe className="h-12 w-12 text-white mx-auto mb-2 opacity-90" />
               <h1 className="text-2xl font-bold text-white tracking-wide">NetAdmin<span className="font-light opacity-80">Pro</span></h1>
               <p className="text-blue-100 text-sm mt-1">Enterprise Gateway Interface</p>
            </div>
            
            <div className="p-8">
               <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                           type="text" 
                           className="pl-10 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white" 
                           placeholder="admin"
                           value={loginForm.username}
                           onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                        />
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Key className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                           type="password" 
                           className="pl-10 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white" 
                           placeholder="••••••"
                           value={loginForm.password}
                           onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        />
                     </div>
                  </div>

                  {loginError && (
                     <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                        <AlertTriangle className="h-4 w-4" />
                        {loginError}
                     </div>
                  )}

                  <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                     Sign In
                  </button>
               </form>
               <div className="mt-6 text-center text-xs text-slate-400">
                  <p>Default Access: admin / admin</p>
                  <p className="mt-1">Firmware: {config.system.firmware}</p>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-900' : 'bg-slate-100'}`}>
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white text-sm font-medium animate-bounce-in ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'danger' ? 'bg-red-600' : 'bg-blue-600'}`}>{toast.message}</div>}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><Globe className="h-6 w-6 text-blue-600 mr-2" /><span className="text-xl font-bold text-slate-800 dark:text-white">NetAdmin<span className="text-blue-600">Pro</span></span></div>
        <nav className="mt-6 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-100px)]">
          <SidebarItem id="dashboard" label="Dashboard" icon={Activity} />
          <SidebarItem id="topology" label="Topology Map" icon={Share2} />
          <SidebarItem id="network" label="Network" icon={Globe} />
          <SidebarItem id="wireless" label="Wireless" icon={Wifi} />
          <SidebarItem id="clients" label="Clients" icon={Smartphone} />
          <SidebarItem id="storage" label="USB Storage" icon={HardDrive} />
          <SidebarItem id="vpn" label="VPN Server" icon={Lock} />
          <SidebarItem id="security" label="Firewall" icon={Shield} />
          <SidebarItem id="tools" label="System Tools" icon={Settings} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" onClick={() => {if(showUserMenu) setShowUserMenu(false)}}>
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shadow-sm z-20">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-slate-500">{isMobileMenuOpen ? <X /> : <Menu />}</button>
          <div className="flex-1 px-4 text-slate-800 dark:text-slate-200 font-medium truncate flex items-center gap-2">
             <Server size={16} className="text-slate-400"/> {config.system.hostname} <span className="text-slate-300">/</span> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          <div className="flex items-center gap-4">
             {activeScenario && <div className="hidden md:flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse"><AlertOctagon className="w-3 h-3" /> TROUBLESHOOTING ACTIVE</div>}
             <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
             
             {/* USER MENU DROPDOWN */}
             <div className="relative">
                 <div 
                    className="flex items-center gap-2 cursor-pointer border-l pl-4 border-slate-200 dark:border-slate-700 group"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenu(!showUserMenu);
                    }}
                 >
                    <div className="text-right hidden sm:block">
                       <div className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">Admin User</div>
                       <div className="text-[10px] text-green-500">Logged In</div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs shadow-inner ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                        AD
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                 </div>
                 
                 {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-fade-in-down origin-top-right">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Administrator</p>
                            <p className="text-xs text-slate-500 truncate">admin@local</p>
                        </div>
                        <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                            onClick={() => {
                                setShowUserMenu(false);
                                setActiveTab('tools');
                            }}
                        >
                            <Settings size={14} /> Account Settings
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                 )}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
           {activeTab === 'dashboard' && renderDashboard()}
           {activeTab === 'topology' && renderTopology()}
           {activeTab === 'network' && renderNetwork()}
           {activeTab === 'wireless' && renderWireless()}
           {activeTab === 'clients' && renderClients()}
           {activeTab === 'storage' && renderStorage()}
           {activeTab === 'vpn' && renderVPN()} 
           {activeTab === 'security' && renderSecurity()} 
           {activeTab === 'tools' && renderTools()}
        </div>
      </main>
      
      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" />}
    </div>
  );
}