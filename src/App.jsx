import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Wifi, Shield, Globe, Cpu, Smartphone, 
  Settings, Terminal, LogOut, Menu, X, Save, 
  RefreshCw, Upload, Download, Moon, Sun, Search,
  AlertTriangle, CheckCircle, Lock, Server, Play, Pause,
  Cloud, Laptop, Share2, Sliders, Clock, Key, Layers, 
  BarChart2, AlertOctagon, Zap, Trash2, Plus, HardDrive, 
  Folder, FileText, Film, Music, Image as ImageIcon, Move,
  User, ChevronDown, Edit2, Link, ClipboardList, Gauge, StopCircle, Video, Bell
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
    priorities: [
        { id: 'zoom', name: 'Zoom / Video Conferencing', priority: 'high' },
        { id: 'gaming', name: 'Online Gaming', priority: 'high' },
        { id: 'streaming', name: 'Video Streaming (YouTube/Netflix)', priority: 'medium' },
        { id: 'web', name: 'Web Browsing', priority: 'normal' },
        { id: 'downloads', name: 'File Downloads', priority: 'low' }
    ]
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
  { id: 1, name: 'John-iPhone', ip: '192.168.1.101', mac: 'AA:BB:CC:11:22:33', type: 'wifi', status: 'online', blocked: false, usage: 15, priority: 'normal', downLimit: 0, upLimit: 0 },
  { id: 2, name: 'LivingRoom-TV', ip: '192.168.1.102', mac: 'AA:BB:CC:44:55:66', type: 'ethernet', status: 'online', blocked: false, usage: 85, priority: 'high', downLimit: 0, upLimit: 0 },
  { id: 3, name: 'Unknown-Device', ip: '192.168.1.105', mac: '11:22:33:44:55:66', type: 'wifi', status: 'offline', blocked: true, usage: 0, priority: 'normal', downLimit: 5, upLimit: 1 },
  { id: 4, name: 'Gaming-PC', ip: '192.168.1.110', mac: 'DD:EE:FF:77:88:99', type: 'ethernet', status: 'online', blocked: false, usage: 120, priority: 'high', downLimit: 0, upLimit: 0 },
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

const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin', role: ROLES.ADMIN },
  { username: 'operator', password: 'operator', role: ROLES.OPERATOR },
  { username: 'viewer', password: 'viewer', role: ROLES.VIEWER }
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
const TerminalCLI = ({ config, updateConfig, setRebooting, onFactoryReset, role }) => {
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
           if (role !== ROLES.ADMIN) {
             response = [{ type: 'error', text: 'Permission denied: Admin privileges required' }];
           } else if (!args[1]) {
             response = [{ type: 'error', text: 'Usage: passwd <new_password>' }];
           } else {
             updateConfig('system', 'adminPassword', args[1]);
             response = [{ type: 'success', text: 'passwd: password updated successfully' }];
           }
           break;
        case 'reboot':
           if (role !== ROLES.ADMIN) {
             response = [{ type: 'error', text: 'Permission denied: Admin privileges required' }];
           } else {
             response = [{ type: 'warning', text: 'Broadcast message from root@NetAdmin-Pro-X1:\nThe system is going down for reboot NOW!' }];
             setTimeout(() => setRebooting(true), 1500);
           }
           break;
        case 'update':
           if (role !== ROLES.ADMIN) {
             response = [{ type: 'error', text: 'Permission denied: Admin privileges required' }];
           } else {
             response = [{ type: 'info', text: 'Connecting to update server... Connected.\nChecking firmware... Found v3.1.0-stable.\nDownloading image... [####################] 100%\nVerifying signature... OK.\nSystem configured to boot new image on restart.\nInitiating reboot sequence...' }];
             updateConfig('system', 'firmware', 'v3.1.0-stable');
             setTimeout(() => setRebooting(true), 3000);
           }
           break;
        case 'reset':
           if (role !== ROLES.ADMIN) {
             response = [{ type: 'error', text: 'Permission denied: Admin privileges required' }];
           } else if (args[1] === '-y') {
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

  // NEW AUTH STATE
  const [session, setSession] = useState(null);
  const [loginAttempts, setLoginAttempts] = useState({ count: 0, lockUntil: null });

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

  // Tools: Speed Test & Sniffer State
  const [speedTest, setSpeedTest] = useState({ status: 'idle', progress: 0, ping: 0, download: 0, upload: 0 });
  const [sniffer, setSniffer] = useState({ active: false, packets: [] });
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toISOString(), severity: 'Info', facility: 'System', msg: 'System started successfully' },
    { id: 2, time: new Date(Date.now() - 50000).toISOString(), severity: 'Info', facility: 'WAN', msg: 'WAN IP acquired: 192.0.2.45' },
    { id: 3, time: new Date(Date.now() - 100000).toISOString(), severity: 'Warning', facility: 'WiFi', msg: 'Channel interference detected on Ch 6' },
  ]);

  // Core Router State
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('routerConfig');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge or ensure new keys exist
        return { ...DEFAULT_CONFIG, ...parsed, qos: parsed.qos || DEFAULT_CONFIG.qos };
    }
    return DEFAULT_CONFIG;
  });

  // Config Engine State
  const [lastAppliedConfig, setLastAppliedConfig] = useState(config);
  const [isConfigDirty, setIsConfigDirty] = useState(false);
  const [configHistory, setConfigHistory] = useState([]);
  const [rollbackTimer, setRollbackTimer] = useState(null);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  
  const [clients, setClients] = useState(DEFAULT_CLIENTS);
  
  // Real-time Simulation State
  const [trafficHistory, setTrafficHistory] = useState(Array(60).fill({ up: 0, down: 0 }));
  const [dpiData, setDpiData] = useState({ streaming: 30, gaming: 10, web: 40, others: 20 });
  const [analyticsPeriod, setAnalyticsPeriod] = useState('24h');

  // Mock Data for Analytics (Moved to top level to avoid Hook errors)
  const analyticsData = React.useMemo(() => {
      const points = analyticsPeriod === '24h' ? 24 : analyticsPeriod === '7d' ? 7 : 30;
      return Array.from({length: points}, (_, i) => ({
          label: analyticsPeriod === '24h' ? `${i}:00` : analyticsPeriod === '7d' ? `Day ${i+1}` : `${i+1}`,
          down: Math.floor(Math.random() * 80) + 20,
          up: Math.floor(Math.random() * 40) + 5
      }));
  }, [analyticsPeriod]);

  // Memoize client usage to prevent jitter (Moved to top level)
  const clientUsage = React.useMemo(() => {
      // Generate usage for all clients and sort by highest usage first
      const allClientsWithUsage = clients.map(c => ({
          ...c,
          usage: Math.floor(Math.random() * 500) + 50
      }));
      return allClientsWithUsage.sort((a, b) => b.usage - a.usage).slice(0, 3);
  }, [clients]);
  
  // Dynamic System Stats (CPU/RAM)
  const [systemStats, setSystemStats] = useState({ cpu: 12, mem: 45, temp: 42, diskHealth: 'Good' });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Sync nodes with clients for Topology Map
  useEffect(() => {
      setNodes(prev => {
          // Keep existing positions for existing clients
          const existingPositions = new Map(prev.clients.map(n => [n.id, {x: n.x, y: n.y}]));
          
          const newClientNodes = clients.map((c, i) => {
              if (existingPositions.has(c.id)) {
                  return { id: c.id, ...existingPositions.get(c.id) };
              }
              // New client: Assign a random position near the bottom
              return { 
                  id: c.id, 
                  x: Math.random() * 80 + 10, 
                  y: Math.random() * 40 + 50 
              };
          });
          
          return { ...prev, clients: newClientNodes };
      });
  }, [clients]);

  // Hovered Node State for Topology
  const [hoveredNode, setHoveredNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const mapRef = useRef(null);
  
  // New Diagnostics State
  const [pingHistory, setPingHistory] = useState(Array(60).fill(0));
  const [dnsQuery, setDnsQuery] = useState('');
  const [dnsResult, setDnsResult] = useState(null);
  
  // Topology Context Menu
  const [contextMenu, setContextMenu] = useState(null);

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
      setSystemStats(prev => {
          const newCpu = Math.max(2, Math.min(100, prev.cpu + (Math.random() - 0.5) * 15));
          
          // Memory Leak Simulation: Small chance to increment without decrement
          // Normal fluctuation + occasional leak
          const memChange = (Math.random() - 0.5) * 2 + (Math.random() > 0.99 ? 0.5 : 0); 
          const newMem = Math.max(20, Math.min(99, prev.mem + memChange));
          
          // Temp follows CPU but lags/smoother
          // Base temp 40C, +0.5C per CPU %
          const targetTemp = 40 + (newCpu * 0.5); 
          const newTemp = prev.temp + (targetTemp - prev.temp) * 0.1;

          // Disk SMART Warning Simulation (Very Rare)
          let newDisk = prev.diskHealth;
          if (Math.random() > 0.9999 && prev.diskHealth === 'Good') newDisk = 'Warning';

          // Check Thresholds & Trigger Alerts
          if (newTemp > 85) addNotification('High CPU Temperature', `CPU is running hot at ${Math.floor(newTemp)}°C`, 'warning');
          if (newMem > 95) addNotification('Memory Warning', `System memory usage is critical: ${Math.floor(newMem)}%`, 'danger');
          if (newDisk === 'Warning' && prev.diskHealth === 'Good') addNotification('Disk SMART Alert', 'Primary storage reporting SMART errors', 'danger');

          return {
              cpu: newCpu,
              mem: newMem,
              temp: newTemp,
              diskHealth: newDisk
          };
      });

      // 4. Wi-Fi Signal Simulation
      setWifiNeighbors(prev => prev.map(n => ({
        ...n,
        strength: Math.max(20, Math.min(95, n.strength + (Math.random() - 0.5) * 10))
      })));
      setUserSignalStrength(prev => Math.max(60, Math.min(98, prev + (Math.random() - 0.5) * 5)));

      // 5. Speed Test Logic
      if (speedTest.status === 'running') {
        setSpeedTest(prev => {
           let next = { ...prev };
           next.progress += 2;
           
           if (next.progress < 20) {
               next.ping = Math.floor(Math.random() * 20) + 5;
           } else if (next.progress < 60) {
               next.download = Math.floor(Math.random() * 300) + 100 + Math.floor(Math.random() * 50);
           } else if (next.progress < 90) {
               next.upload = Math.floor(Math.random() * 100) + 20 + Math.floor(Math.random() * 30);
           }
           
           if (next.progress >= 100) {
               next.status = 'complete';
               next.progress = 100;
           }
           return next;
        });
      }

      // 6. Packet Sniffer Logic
      if (sniffer.active) {
         setSniffer(prev => {
             const protocols = ['TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'TLSv1.3'];
             const src = `192.168.1.${Math.floor(Math.random() * 254)}`;
             const dst = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
             const newPacket = {
                 id: Date.now(),
                 time: new Date().toLocaleTimeString(),
                 src,
                 dst,
                 proto: protocols[Math.floor(Math.random() * protocols.length)],
                 len: Math.floor(Math.random() * 1500)
             };
             // Keep last 50 packets
             return { ...prev, packets: [newPacket, ...prev.packets].slice(0, 50) };
         });
      }

      // 7. Random Log Generation
      if (Math.random() > 0.99) { // Occasional log (1% chance)
          const severities = ['Info', 'Warning', 'Error'];
          const facilities = ['System', 'Auth', 'DHCP', 'Kernel', 'WiFi'];
          const messages = [
              'DHCP lease renewed for 192.168.1.105',
              'Auth failed for user admin from 192.168.1.50',
              'Kernel panic - recovered',
              'WiFi client disconnected (Reason: Beacon timeout)',
              'NTP synchronized with time.google.com'
          ];
          const newLog = {
              id: Date.now(),
              time: new Date().toISOString(),
              severity: severities[Math.floor(Math.random() * severities.length)],
              facility: facilities[Math.floor(Math.random() * facilities.length)],
              msg: messages[Math.floor(Math.random() * messages.length)]
          };
          setLogs(prev => [newLog, ...prev].slice(0, 100));
      }

      // 8. Intrusion Detection Simulation
      if (Math.random() > 0.995) { // Reduced to 0.5% chance per tick
          const threats = [
              {
                  title: 'Port Scan Detected',
                  msg: 'Port scan detected from 192.168.1.105 targeting ports 20-1024.',
                  severity: 'warning',
                  action: 'Source IP temporarily blocked'
              },
              {
                  title: 'Suspicious DNS Activity',
                  msg: 'Possible DNS tunneling detected. High volume of TXT records.',
                  severity: 'danger',
                  action: 'Traffic blocked & Logged'
              },
              {
                  title: 'Brute-force Attempt',
                  msg: 'Multiple failed login attempts detected from external IP 203.0.113.45.',
                  severity: 'danger',
                  action: 'IP Blacklisted'
              }
          ];
          
          const threat = threats[Math.floor(Math.random() * threats.length)];
          addNotification(threat.title, `${threat.msg} [Action: ${threat.action}]`, threat.severity);
          
          // Also add to system logs
          setLogs(prev => [{
              id: Date.now(),
              time: new Date().toISOString(),
              severity: threat.severity === 'danger' ? 'Error' : 'Warning',
              facility: 'Security',
              msg: `${threat.title}: ${threat.msg} Action Taken: ${threat.action}`
          }, ...prev].slice(0, 100));
      }

      // 10. Dynamic Client Simulation
      if (Math.random() > 0.95) { // 5% chance per tick
          setClients(prev => {
              const action = Math.random();
              
              // Toggle Online/Offline (40% chance)
              if (action < 0.4) {
                  if (prev.length === 0) return prev;
                  const idx = Math.floor(Math.random() * prev.length);
                  const newClients = [...prev];
                  // Don't toggle blocked clients or high priority ones too often
                  if (!newClients[idx].blocked && newClients[idx].priority !== 'high') {
                      const isGoingOffline = newClients[idx].status === 'online';
                      newClients[idx] = { 
                          ...newClients[idx], 
                          status: isGoingOffline ? 'offline' : 'online',
                          usage: isGoingOffline ? 0 : Math.floor(Math.random() * 50)
                      };
                      
                      // Log the event
                      if (Math.random() > 0.5) {
                           setLogs(logs => [{
                              id: Date.now(),
                              time: new Date().toISOString(),
                              severity: 'Info',
                              facility: 'WiFi',
                              msg: `Client ${newClients[idx].name} ${isGoingOffline ? 'disconnected' : 'connected'}`
                          }, ...logs].slice(0, 100));
                      }
                  }
                  return newClients;
              }
              
              // Add New Client (30% chance) - Max 15 clients
              if (action < 0.7 && prev.length < 15) {
                  const types = ['wifi', 'ethernet'];
                  const deviceNames = ['Guest-Phone', 'Smart-Bulb', 'Laptop-Work', 'Tablet-Kid', 'IoT-Sensor', 'Visitor-PC', 'Smart-Watch', 'Kindle'];
                  const name = `${deviceNames[Math.floor(Math.random() * deviceNames.length)]}-${Math.floor(Math.random() * 100)}`;
                  const ip = `192.168.1.${100 + Math.floor(Math.random() * 150)}`;
                  const mac = Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase();
                  
                  const newClient = {
                      id: Date.now(),
                      name,
                      ip,
                      mac,
                      type: types[Math.floor(Math.random() * types.length)],
                      status: 'online',
                      blocked: false,
                      usage: Math.floor(Math.random() * 100),
                      priority: 'normal',
                      downLimit: 0,
                      upLimit: 0
                  };
                  
                  // Add log for new connection
                  setLogs(logs => [{
                      id: Date.now(),
                      time: new Date().toISOString(),
                      severity: 'Info',
                      facility: 'DHCP',
                      msg: `DHCPACK on ${ip} to ${mac} (${name})`
                  }, ...logs].slice(0, 100));

                  return [...prev, newClient];
              }
              
              // Remove Offline Client (30% chance) - Keep at least 3
              if (prev.length > 3) {
                  const offlineClients = prev.filter(c => c.status === 'offline' && !c.blocked);
                  if (offlineClients.length > 0) {
                      const toRemove = offlineClients[Math.floor(Math.random() * offlineClients.length)];
                      return prev.filter(c => c.id !== toRemove.id);
                  }
              }
              
              return prev;
          });
      }

      setUptime(prev => prev + 1);
      
      // 9. Ping History
      setPingHistory(prev => [...prev.slice(1), Math.floor(Math.random() * 20) + 10 + (Math.random() > 0.9 ? 50 : 0)]);
    }, 1000); 
    return () => clearInterval(interval);
  }, [rebooting, isLoggedIn, speedTest.status, sniffer.active]); 

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
            
            // Logout user after reboot
            setIsLoggedIn(false);
            setSession(null);
            
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

  const addNotification = (title, message, type = 'info') => {
      const id = Date.now();
      setNotifications(prev => {
          // Prevent duplicate spam (debounce 10s)
          if (prev.length > 0 && prev[0].title === title && (Date.now() - prev[0].timestamp) < 10000) return prev;
          return [{ id, title, message, type, timestamp: Date.now(), read: false }, ...prev].slice(0, 20);
      });
      // Also show toast for immediate visibility
      showToast(`${title}: ${message}`, type);
  };

  const addAuditLog = (action, details) => {
      const user = session?.user || 'System';
      const newLog = {
          id: Date.now(),
          time: new Date().toISOString(),
          severity: 'Info',
          facility: 'Audit',
          msg: `[${action}] [User: ${user}] ${details}`
      };
      setLogs(prev => [newLog, ...prev]);
  };

  // Idle Timer
  useEffect(() => {
      if (!isLoggedIn) return;
      
      const handleActivity = () => {
          if (session) {
              setSession(prev => ({ ...prev, expiry: new Date(Date.now() + 15 * 60 * 1000) }));
          }
      };
      
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      
      const interval = setInterval(() => {
          if (session && new Date() > session.expiry) {
              handleLogout();
              showToast('Session expired due to inactivity', 'warning');
          }
      }, 1000);

      return () => {
          window.removeEventListener('mousemove', handleActivity);
          window.removeEventListener('keydown', handleActivity);
          clearInterval(interval);
      };
  }, [isLoggedIn, session]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Check Lockout
    if (loginAttempts.lockUntil && new Date() < loginAttempts.lockUntil) {
       setLoginError(`Account locked. Try again in ${Math.ceil((loginAttempts.lockUntil - new Date())/1000)}s`);
       return;
    }

    const user = DEFAULT_USERS.find(u => {
        const storedPassword = u.username === 'admin' ? config.system.adminPassword : u.password;
        return u.username === loginForm.username && storedPassword === loginForm.password;
    });

    if (user) {
      const token = Math.random().toString(36).substr(2);
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      setSession({ user: user.username, role: user.role, token, expiry });
      setIsLoggedIn(true);
      setLoginError('');
      setLoginAttempts({ count: 0, lockUntil: null });
      addAuditLog('User Login', `User ${user.username} logged in successfully`);
    } else {
      const newCount = loginAttempts.count + 1;
      let lockUntil = null;
      if (newCount >= 3) {
          lockUntil = new Date(Date.now() + 300 * 1000); // 5 minutes lock
      }
      setLoginAttempts({ count: newCount, lockUntil });
      
      if (lockUntil) {
          setLoginError(`Too many attempts. Locked for 5 minutes.`);
      } else {
          const attemptsLeft = 3 - newCount;
          setLoginError(`Invalid credentials. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`);
      }
    }
  };

  const handleLogout = () => {
    if (session) addAuditLog('User Logout', `User ${session.user} logged out`);
    setIsLoggedIn(false);
    setShowUserMenu(false);
    setSession(null);
    setLoginForm({ username: '', password: '' });
    showToast('Logged out successfully', 'info');
  };

  const updateConfig = (section, key, value) => {
    // CSRF & RBAC Protection
    if (!session?.token) {
        showToast('Security Alert: Invalid Session Token (CSRF Blocked)', 'danger');
        return;
    }
    if (session?.role !== ROLES.ADMIN) {
        showToast('Access Denied: Admin privileges required', 'danger');
        addAuditLog('Security', `Unauthorized config attempt by ${session?.user}`);
        return;
    }
    setConfig(prev => {
      const next = { ...prev, [section]: { ...prev[section], [key]: value } };
      setIsConfigDirty(JSON.stringify(next) !== JSON.stringify(lastAppliedConfig));
      return next;
    });
  };

  const validateConfig = (cfg) => {
      const errors = [];
      if (cfg.lan.ip === cfg.wan.ip) errors.push("LAN IP cannot match WAN IP");
      if (cfg.wireless.security !== 'none' && cfg.wireless.password.length < 8) errors.push("Wi-Fi password too weak");
      return errors;
  };

  const handleApplyConfig = () => {
      // CSRF & RBAC Protection
      if (!session?.token) {
          showToast('Security Alert: Invalid Session Token (CSRF Blocked)', 'danger');
          return;
      }
      if (session?.role !== ROLES.ADMIN) {
          showToast('Access Denied: Admin privileges required', 'danger');
          return;
      }
      const errors = validateConfig(config);
      if (errors.length > 0) {
          showToast(errors.join(', '), 'danger');
          return;
      }
      
      setConfigHistory(prev => [lastAppliedConfig, ...prev].slice(0, 10));
      setLastAppliedConfig(config);
      setIsConfigDirty(false);
      setShowRollbackModal(true);
      setRollbackTimer(15);
  };

  const revertConfig = () => {
      setShowRollbackModal(false);
      setConfigHistory(prev => {
          const safeConfig = prev[0] || DEFAULT_CONFIG;
          setConfig(safeConfig);
          setLastAppliedConfig(safeConfig);
          return prev;
      });
      showToast('Configuration reverted.', 'warning');
      addAuditLog('Config Revert', 'Configuration reverted automatically or by user');
  };

  const confirmConfig = () => {
      setShowRollbackModal(false);
      showToast('Configuration confirmed.', 'success');
      addAuditLog('Config Apply', 'Configuration applied and confirmed');
  };

  // Rollback Timer Effect
  useEffect(() => {
      let interval;
      if (showRollbackModal && rollbackTimer > 0) {
          interval = setInterval(() => {
              setRollbackTimer(prev => prev - 1);
          }, 1000);
      } else if (showRollbackModal && rollbackTimer === 0) {
          revertConfig();
      }
      return () => clearInterval(interval);
  }, [showRollbackModal, rollbackTimer]);

  const handleSave = () => handleApplyConfig();

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
      if (!session?.token) return; // CSRF Check
      if (session?.role !== ROLES.ADMIN) {
          showToast('Access Denied: Admin privileges required', 'danger');
          return;
      }
      const newConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      scenario.setup(newConfig);
      setConfig(newConfig);
      setActiveScenario(scenario);
      setScenarioSolved(false);
      showToast(`Scenario Started: ${scenario.title}`, 'danger');
      addAuditLog('Scenario Start', `Started scenario: ${scenario.title}`);
      setActiveTab('dashboard');
  };

  const exitScenario = () => {
      if (!session?.token) return; // CSRF Check
      if (session?.role !== ROLES.ADMIN) {
          showToast('Access Denied: Admin privileges required', 'danger');
          return;
      }
      setActiveScenario(null);
      setScenarioSolved(false);
      setConfig(DEFAULT_CONFIG);
      showToast('Exited troubleshooting mode. Restored defaults.', 'info');
      addAuditLog('Scenario Exit', 'Exited troubleshooting mode');
  };

  // --- CHART RENDERER (SVG) ---
  const PingGraph = ({ data }) => {
     const width = 100;
     const height = 40;
     const maxVal = 100; 
     const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - (Math.min(d, maxVal) / maxVal) * height}`).join(' ');
     return (
        <svg className="w-full h-24 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
           <path d={`M 0,${height} ${points} L ${width},${height} Z`} fill="rgba(239, 68, 68, 0.2)" />
           <polyline points={points} fill="none" stroke="#ef4444" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
     );
  };

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

  const renderLogs = () => (
      <div className="max-w-6xl mx-auto space-y-6">
          <Card title="System Log Viewer">
              <div className="flex gap-2 mb-4">
                  <Button variant="secondary" className="text-xs h-8">All Levels</Button>
                  <Button variant="secondary" className="text-xs h-8">Info</Button>
                  <Button variant="secondary" className="text-xs h-8">Warning</Button>
                  <Button variant="secondary" className="text-xs h-8">Error</Button>
                  <div className="flex-1"></div>
                  <Button variant="secondary" icon={RefreshCw} className="text-xs h-8">Refresh</Button>
                  <Button variant="secondary" icon={Trash2} className="text-xs h-8">Clear</Button>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="min-w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium">
                          <tr>
                              <th className="px-4 py-2">Time</th>
                              <th className="px-4 py-2">Facility</th>
                              <th className="px-4 py-2">Severity</th>
                              <th className="px-4 py-2">Message</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {logs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-4 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">{log.time}</td>
                                  <td className="px-4 py-2">{log.facility}</td>
                                  <td className="px-4 py-2">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          log.severity === 'Error' ? 'bg-red-100 text-red-700' :
                                          log.severity === 'Warning' ? 'bg-orange-100 text-orange-700' :
                                          'bg-blue-100 text-blue-700'
                                      }`}>
                                          {log.severity}
                                      </span>
                                  </td>
                                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{log.msg}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>
      </div>
  );

  const renderDiagnostics = () => (
      <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Speed Test Card */}
              <Card title="Internet Speed Test">
                  <div className="flex flex-col items-center justify-center p-6">
                      <div className="relative w-48 h-24 mb-6 overflow-hidden">
                          {/* Gauge Arc Background */}
                          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-700 box-border" style={{clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'}}></div>
                          {/* Gauge Value Arc */}
                          <div 
                              className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-blue-500 box-border transition-all duration-300 ease-out" 
                              style={{
                                  clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                                  transform: `rotate(${speedTest.progress * 1.8 - 180}deg)`
                              }}
                          ></div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                              <span className="text-3xl font-bold text-slate-800 dark:text-white">
                                  {speedTest.status === 'idle' ? 'GO' : 
                                   speedTest.progress < 60 ? speedTest.download : speedTest.upload}
                              </span>
                              <span className="block text-xs text-slate-400">Mbps</span>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 w-full mb-6">
                          <div className="text-center">
                              <div className="text-xs text-slate-400 uppercase tracking-wide">Ping</div>
                              <div className="text-xl font-mono text-slate-700 dark:text-slate-200">{speedTest.ping}<span className="text-xs ml-1">ms</span></div>
                          </div>
                          <div className="text-center">
                              <div className="text-xs text-slate-400 uppercase tracking-wide">Download</div>
                              <div className="text-xl font-mono text-green-500">{speedTest.download}<span className="text-xs ml-1">Mbps</span></div>
                          </div>
                          <div className="text-center">
                              <div className="text-xs text-slate-400 uppercase tracking-wide">Upload</div>
                              <div className="text-xl font-mono text-blue-500">{speedTest.upload}<span className="text-xs ml-1">Mbps</span></div>
                          </div>
                      </div>

                      <Button 
                          onClick={() => setSpeedTest({ status: 'running', progress: 0, ping: 0, download: 0, upload: 0 })}
                          disabled={speedTest.status === 'running'}
                          className="w-full justify-center"
                          icon={Gauge}
                      >
                          {speedTest.status === 'running' ? 'Testing...' : 'Start Test'}
                      </Button>
                  </div>
              </Card>

              {/* Live Latency Graph */}
              <Card title="Live Latency (Ping)">
                  <div className="p-4">
                      <div className="flex justify-between items-end mb-2">
                          <div className="text-3xl font-bold text-slate-800 dark:text-white">
                              {pingHistory[pingHistory.length-1]} <span className="text-sm font-normal text-slate-500">ms</span>
                          </div>
                          <div className="text-xs text-slate-400">Target: 8.8.8.8</div>
                      </div>
                      <PingGraph data={pingHistory} />
                  </div>
              </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DNS Lookup Tool */}
              <Card title="DNS Lookup Tool">
                  <div className="flex gap-2 mb-4">
                      <input 
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 dark:text-white"
                          placeholder="Enter domain (e.g. google.com)"
                          value={dnsQuery}
                          onChange={(e) => setDnsQuery(e.target.value)}
                      />
                      <Button onClick={() => {
                          if(!dnsQuery) return;
                          setDnsResult({ loading: true });
                          setTimeout(() => {
                              setDnsResult({
                                  domain: dnsQuery,
                                  records: [
                                      { type: 'A', value: '142.250.190.46', ttl: 300 },
                                      { type: 'AAAA', value: '2607:f8b0:4009:804::200e', ttl: 300 },
                                      { type: 'MX', value: 'smtp.google.com', ttl: 3600 }
                                  ],
                                  loading: false
                              });
                          }, 1000);
                      }}>Lookup</Button>
                  </div>
                  {dnsResult && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[150px]">
                          {dnsResult.loading ? (
                              <div className="flex items-center justify-center h-full text-slate-500">Querying DNS servers...</div>
                          ) : (
                              <div className="space-y-2 font-mono text-sm">
                                  <div className="text-slate-500 border-b pb-1 mb-2">Results for {dnsResult.domain}</div>
                                  {dnsResult.records.map((rec, i) => (
                                      <div key={i} className="flex gap-4">
                                          <span className="w-12 font-bold text-blue-600">{rec.type}</span>
                                          <span className="flex-1 text-slate-700 dark:text-slate-300">{rec.value}</span>
                                          <span className="text-slate-400">{rec.ttl}s</span>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
              </Card>

              {/* Packet Sniffer Card */}
              <Card title="Packet Capture (Sniffer)">
                   <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${sniffer.active ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
                           <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{sniffer.active ? 'Capturing on eth0...' : 'Idle'}</span>
                       </div>
                       <Button 
                          variant={sniffer.active ? "danger" : "success"} 
                          onClick={() => setSniffer(prev => ({...prev, active: !prev.active}))}
                          icon={sniffer.active ? StopCircle : Play}
                          className="h-8 text-xs"
                       >
                           {sniffer.active ? 'Stop Capture' : 'Start Capture'}
                       </Button>
                   </div>
                   
                   <div className="h-64 overflow-y-auto bg-black rounded-lg border border-slate-700 font-mono text-xs text-green-400 p-2">
                       <table className="w-full text-left">
                           <thead>
                               <tr className="text-slate-500 border-b border-slate-800">
                                   <th className="pb-1 w-20">Time</th>
                                   <th className="pb-1 w-28">Source</th>
                                   <th className="pb-1 w-28">Dest</th>
                                   <th className="pb-1 w-16">Proto</th>
                                   <th className="pb-1">Len</th>
                               </tr>
                           </thead>
                           <tbody>
                               {sniffer.packets.length === 0 ? (
                                   <tr><td colSpan="5" className="text-slate-600 text-center py-4">No packets captured</td></tr>
                               ) : (
                                   sniffer.packets.map(p => (
                                       <tr key={p.id} className="hover:bg-slate-900">
                                           <td className="py-0.5 opacity-70">{p.time}</td>
                                           <td className="py-0.5 text-blue-400">{p.src}</td>
                                           <td className="py-0.5 text-orange-400">{p.dst}</td>
                                           <td className="py-0.5">{p.proto}</td>
                                           <td className="py-0.5 opacity-70">{p.len}</td>
                                       </tr>
                                   ))
                               )}
                           </tbody>
                       </table>
                       {/* Auto scroll anchor if needed */}
                   </div>
              </Card>
          </div>
      </div>
  );

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* System Health Card (NEW) */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      <Cpu size={18} className="text-rose-500"/> System Health
                  </h4>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-sm text-slate-600 dark:text-slate-300">CPU Temp</span>
                          <span className={`font-mono text-sm font-bold ${systemStats.temp > 80 ? 'text-red-500' : 'text-green-500'}`}>
                              {Math.floor(systemStats.temp)}°C
                          </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Memory</span>
                          <span className={`font-mono text-sm font-bold ${systemStats.mem > 90 ? 'text-red-500' : 'text-blue-500'}`}>
                              {Math.floor(systemStats.mem)}%
                          </span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Disk SMART</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${systemStats.diskHealth === 'Good' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {systemStats.diskHealth.toUpperCase()}
                          </span>
                      </div>
                  </div>
              </div>

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
        <Button onClick={handleSave} icon={Save} disabled={session?.role !== ROLES.ADMIN}>Save Network Settings</Button>
      </div>
    </div>
  );

  const renderWireless = () => {
    // Channel Optimization Logic
    const recommendChannel = () => {
        const scores = {};
        for (let i = 1; i <= 11; i++) scores[i] = 0;
        
        wifiNeighbors.forEach(n => {
            // Add "interference score" to the channel and adjacent ones
            if (scores[n.channel] !== undefined) scores[n.channel] += n.strength;
            if (scores[n.channel - 1] !== undefined) scores[n.channel - 1] += (n.strength * 0.5);
            if (scores[n.channel + 1] !== undefined) scores[n.channel + 1] += (n.strength * 0.5);
        });
        
        // Find channel with lowest score
        let bestChannel = 1;
        let minScore = Infinity;
        for (let i = 1; i <= 11; i++) {
            if (scores[i] < minScore) {
                minScore = scores[i];
                bestChannel = i;
            }
        }
        return { channel: bestChannel, score: minScore };
    };
    
    const recommendation = recommendChannel();

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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Status</div>
                <div className="flex items-center gap-2">
                    {wifiNeighbors.some(n => n.channel === (config.wireless.channel === 'auto' ? 6 : parseInt(config.wireless.channel))) 
                       ? <AlertTriangle size={16} className="text-red-500"/> 
                       : <CheckCircle size={16} className="text-green-500"/>
                    }
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {wifiNeighbors.some(n => n.channel === (config.wireless.channel === 'auto' ? 6 : parseInt(config.wireless.channel))) 
                           ? "High Interference Detected" 
                           : "Channel Looks Clear"
                        }
                    </span>
                </div>
             </div>
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                <div className="text-xs text-blue-500 uppercase font-bold mb-1">AI Recommendation</div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={16} className="text-blue-600 dark:text-blue-400"/>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Switch to Channel {recommendation.channel}
                        </span>
                    </div>
                    <Button 
                        variant="primary" 
                        className="h-6 text-xs px-2" 
                        onClick={() => {
                            updateConfig('wireless', 'channel', recommendation.channel.toString());
                            showToast(`Switched to optimized channel ${recommendation.channel}`, 'success');
                        }}
                        disabled={session?.role !== ROLES.ADMIN || config.wireless.channel === recommendation.channel.toString()}
                    >
                        Apply
                    </Button>
                </div>
             </div>
          </div>
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

      <div className="flex justify-end"><Button onClick={handleSave} icon={Save} disabled={session?.role !== ROLES.ADMIN}>Save Wireless Settings</Button></div>
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
                        if (session?.role === ROLES.VIEWER) return;
                        const newClients = clients.map(c => c.id === client.id ? {...c, blocked: !c.blocked} : c);
                        setClients(newClients);
                        showToast(`${client.name} ${!client.blocked ? 'blocked' : 'unblocked'}`, !client.blocked ? 'danger' : 'success');
                      }}
                      disabled={session?.role === ROLES.VIEWER}
                      title={session?.role === ROLES.VIEWER ? "Viewers cannot block devices" : ""}
                      className={`${client.blocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'} ${session?.role === ROLES.VIEWER ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                disabled={session?.role === ROLES.VIEWER}
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
                                    className={`text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded ${session?.role === ROLES.VIEWER ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => session?.role !== ROLES.VIEWER && openEditRuleModal(rule)}
                                    title="Edit Rule"
                                    disabled={session?.role === ROLES.VIEWER}
                                >
                                    <Edit2 className="h-4 w-4"/>
                                </button>
                                <button 
                                    className={`text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-slate-700 rounded ${session?.role === ROLES.VIEWER ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => {
                                        if (session?.role === ROLES.VIEWER) return;
                                        const updatedRules = config.parental.rules.filter(r => r.id !== rule.id);
                                        updateConfig('parental', 'rules', updatedRules);
                                        showToast('Rule deleted', 'info');
                                    }}
                                    title="Delete Rule"
                                    disabled={session?.role === ROLES.VIEWER}
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
                        disabled={session?.role !== ROLES.ADMIN}
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
               </div>
             ))}
             <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={openAddSecurityRuleModal} icon={Plus} disabled={session?.role !== ROLES.ADMIN}>Add New Rule</Button>
                <Button 
                    variant="danger" 
                    icon={AlertTriangle} 
                    onClick={() => {
                        const threats = [
                            { title: 'Port Scan Detected', msg: 'Port scan detected from 192.168.1.105 targeting ports 20-1024.', severity: 'warning', action: 'Source IP temporarily blocked' },
                            { title: 'Suspicious DNS Activity', msg: 'Possible DNS tunneling detected. High volume of TXT records.', severity: 'danger', action: 'Traffic blocked & Logged' },
                            { title: 'Brute-force Attempt', msg: 'Multiple failed login attempts detected from external IP 203.0.113.45.', severity: 'danger', action: 'IP Blacklisted' }
                        ];
                        const threat = threats[Math.floor(Math.random() * threats.length)];
                        addNotification(threat.title, `${threat.msg} [Action: ${threat.action}]`, threat.severity);
                        setLogs(prev => [{
                            id: Date.now(),
                            time: new Date().toISOString(),
                            severity: threat.severity === 'danger' ? 'Error' : 'Warning',
                            facility: 'Security',
                            msg: `${threat.title}: ${threat.msg} Action Taken: ${threat.action}`
                        }, ...prev].slice(0, 100));
                    }}
                >
                    Simulate Attack
                </Button>
             </div>
           </div>
        </Card>
        <div className="flex justify-end"><Button onClick={handleSave} icon={Save} disabled={session?.role !== ROLES.ADMIN}>Apply Security Settings</Button></div>
     </div>
  );

  const renderQoS = () => {
      
      return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QoS Configuration */}
                <Card title="Quality of Service (QoS) Engine">
                    <Toggle 
                        label="Enable Smart QoS" 
                        subLabel="Prioritize traffic based on application and device" 
                        enabled={config.qos.enabled} 
                        onChange={(v) => updateConfig('qos', 'enabled', v)} 
                    />
                    
                    {config.qos.enabled && (
                        <div className="mt-6 space-y-6 animate-fade-in">
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Application Priority</h4>
                                <div className="space-y-2">
                                    {config.qos.priorities.map((app, idx) => (
                                        <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-md ${
                                                    app.priority === 'high' ? 'bg-red-100 text-red-600' : 
                                                    app.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 
                                                    app.priority === 'low' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {app.id === 'gaming' ? <Zap size={16}/> : app.id === 'zoom' ? <Video size={16}/> : app.id === 'streaming' ? <Film size={16}/> : <Globe size={16}/>}
                                                </div>
                                                <span className="font-medium text-slate-700 dark:text-slate-200">{app.name}</span>
                                            </div>
                                            <select 
                                                value={app.priority}
                                                onChange={(e) => {
                                                    const newPriorities = [...config.qos.priorities];
                                                    newPriorities[idx].priority = e.target.value;
                                                    updateConfig('qos', 'priorities', newPriorities);
                                                }}
                                                className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="normal">Normal</option>
                                                <option value="low">Low</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Device Bandwidth Limits</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-4 py-2">Device</th>
                                                <th className="px-4 py-2">Download Cap</th>
                                                <th className="px-4 py-2">Upload Cap</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {clients.map(client => (
                                                <tr key={client.id}>
                                                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{client.name}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" 
                                                                className="w-16 px-2 py-1 text-xs border rounded dark:bg-slate-800 dark:border-slate-600" 
                                                                placeholder="Unl"
                                                                value={client.downLimit || ''}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    setClients(clients.map(c => c.id === client.id ? {...c, downLimit: val} : c));
                                                                }}
                                                            />
                                                            <span className="text-xs text-slate-400">Mbps</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" 
                                                                className="w-16 px-2 py-1 text-xs border rounded dark:bg-slate-800 dark:border-slate-600" 
                                                                placeholder="Unl"
                                                                value={client.upLimit || ''}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    setClients(clients.map(c => c.id === client.id ? {...c, upLimit: val} : c));
                                                                }}
                                                            />
                                                            <span className="text-xs text-slate-400">Mbps</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Historical Analytics */}
                <Card title="Traffic Analytics">
                    <div className="flex gap-2 mb-6">
                        {['24h', '7d', '30d'].map(p => (
                            <button 
                                key={p}
                                onClick={() => setAnalyticsPeriod(p)}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    analyticsPeriod === p 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {p === '24h' ? 'Last 24 Hours' : p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                            </button>
                        ))}
                    </div>

                    <div className="h-64 w-full mb-4">
                        <TrafficChart data={analyticsData} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                        <span>{analyticsData[0].label}</span>
                        <span>{analyticsData[Math.floor(analyticsData.length / 2)].label}</span>
                        <span>{analyticsData[analyticsData.length - 1].label}</span>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Top Clients (Total Usage)</h4>
                        <div className="space-y-3">
                            {clientUsage.map((client, i) => (
                                <div key={client.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-slate-400 text-sm">#{i+1}</div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{client.name}</div>
                                            <div className="text-xs text-slate-500">{client.mac}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.usage} GB</div>
                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 ml-auto">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${100 - (i * 20)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      );
  };

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
               <Button variant="secondary" className="w-full justify-center" icon={Upload} onClick={() => showToast('Simulated: Upload Prompt', 'info')} disabled={session?.role !== ROLES.ADMIN}>Restore Configuration</Button>
            </div>
            <div className="space-y-4">
               <h4 className="font-medium text-slate-800 dark:text-slate-200">Operations</h4>
               <Button variant="danger" className="w-full justify-center" icon={RefreshCw} onClick={() => setRebooting(true)} disabled={session?.role !== ROLES.ADMIN}>Reboot Router</Button>
               <Button variant="danger" className="w-full justify-center" icon={AlertTriangle} onClick={() => {setConfig(DEFAULT_CONFIG); showToast('Reset to Factory Defaults', 'success'); setRebooting(true);}} disabled={session?.role !== ROLES.ADMIN}>Factory Reset</Button>
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
                  <Button disabled={session?.role !== ROLES.ADMIN} onClick={() => {
                    if (passwordForm.current !== config.system.adminPassword) {
                      showToast('Incorrect current password', 'danger');
                      return;
                    }
                    if (passwordForm.new !== passwordForm.confirm) {
                      showToast('New passwords do not match', 'danger');
                      return;
                    }
                    if (passwordForm.new.length < 5) {
                      showToast('Password must be at least 5 characters', 'danger');
                      return;
                    }
                    
                    updateConfig('system', 'adminPassword', passwordForm.new);
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
          role={session?.role}
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

    const handleContextMenu = (e, type, id) => {
        e.preventDefault();
        const rect = mapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setContextMenu({ x, y, type, id });
    };

    const autoLayout = () => {
        const newNodes = { ...nodes };
        // Router in center
        newNodes.router = { x: 50, y: 50 };
        newNodes.internet = { x: 50, y: 15 };
        
        // Mesh Topology Layout: Distribute clients in a circle around the router
        const radius = 35; // Distance from center
        const clientCount = clients.length;
        
        clients.forEach((c, i) => {
            const node = newNodes.clients.find(n => n.id === c.id);
            if (node) {
                // Distribute evenly in a circle, starting from angle that avoids the top (Internet)
                // Internet is at -90deg (top). We start at 30deg.
                const angle = (i / clientCount) * 2 * Math.PI + 0.5; 
                
                // Add some randomness for "Mesh" feel
                const randomOffset = (Math.random() - 0.5) * 5;
                
                node.x = 50 + (radius + randomOffset) * Math.cos(angle);
                node.y = 50 + (radius + randomOffset) * Math.sin(angle);
                
                // Clamp to bounds (5-95%)
                node.x = Math.max(5, Math.min(95, node.x));
                node.y = Math.max(5, Math.min(95, node.y));
            }
        });
        
        setNodes(newNodes);
        showToast('Mesh Topology Layout applied', 'success');
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
            if (!detailData) return null;
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
      <div className="max-w-6xl mx-auto h-full flex flex-col" onClick={() => setContextMenu(null)}>
        <Card 
            title="Interactive Topology Map" 
            className="flex-1 min-h-[600px] relative overflow-hidden bg-slate-100 dark:bg-slate-900/50" 
            noPadding
        >
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Button variant="secondary" className="h-8 text-xs shadow-sm bg-white/90 dark:bg-slate-800/90 backdrop-blur" icon={Layers} onClick={autoLayout}>Auto Layout</Button>
          </div>

          <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 z-10 text-xs space-y-2">
             <div className="font-bold mb-1 text-slate-700 dark:text-slate-300">Legend</div>
             <div className="flex items-center gap-2"><div className="w-8 h-1 bg-emerald-500 rounded-full"></div><span className="text-slate-500">Ethernet (1Gbps)</span></div>
             <div className="flex items-center gap-2"><div className="w-8 h-1 border-t-2 border-dashed border-blue-400"></div><span className="text-slate-500">Wi-Fi (866Mbps)</span></div>
             <div className="flex items-center gap-2"><div className="w-8 h-1 bg-orange-500 rounded-full"></div><span className="text-slate-500">High Traffic</span></div>
             <div className="flex items-center gap-2"><div className="w-8 h-1 bg-red-500 rounded-full"></div><span className="text-slate-500">Congested</span></div>
             <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2">Right-click nodes for actions</div>
          </div>
          
          <div className="relative w-full h-full min-h-[600px]" ref={mapRef}>
             {/* Render Detail Popover */}
             {renderNodeDetail()}

             {/* Context Menu */}
             {contextMenu && (
                 <div 
                    className="absolute z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 w-48 animate-fade-in"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                 >
                     {contextMenu.type === 'clients' ? (
                         <>
                             <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => {
                                 const client = clients.find(c => c.id === contextMenu.id);
                                 if (!client) return;
                                 const newClients = clients.map(c => c.id === contextMenu.id ? {...c, blocked: !c.blocked} : c);
                                 setClients(newClients);
                                 showToast(`${client.name} ${!client.blocked ? 'blocked' : 'unblocked'}`, !client.blocked ? 'danger' : 'success');
                                 setContextMenu(null);
                             }}>
                                 <Shield size={14}/> Block Device
                             </button>
                             <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => {
                                 const client = clients.find(c => c.id === contextMenu.id);
                                 if (!client) return;
                                 const newPriority = client.priority === 'high' ? 'normal' : 'high';
                                 const newClients = clients.map(c => c.id === contextMenu.id ? {...c, priority: newPriority} : c);
                                 setClients(newClients);
                                 showToast(`Device priority set to ${newPriority}`, 'success');
                                 setContextMenu(null);
                             }}>
                                 <Zap size={14} className={clients.find(c => c.id === contextMenu.id)?.priority === 'high' ? 'text-yellow-500' : ''}/> 
                                 {clients.find(c => c.id === contextMenu.id)?.priority === 'high' ? 'Remove Priority' : 'Prioritize Traffic'}
                             </button>
                             <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                             <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => {
                                 setActiveTab('clients');
                                 setContextMenu(null);
                             }}>
                                 <Settings size={14}/> View Details
                             </button>
                         </>
                     ) : (
                         <div className="px-4 py-2 text-xs text-slate-500">No actions available</div>
                     )}
                 </div>
             )}

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
                    if (!client) return null;
                    const isWifi = client.type === 'wifi';
                    
                    // Logical Link Metrics
                    const linkSpeed = isWifi ? '866 Mbps' : '1 Gbps';
                    const vlan = isWifi ? 'VLAN 20' : 'VLAN 10';
                    const packetLoss = client.status === 'online' ? (Math.random() * 0.5).toFixed(1) + '%' : '100%';
                    
                    // Congestion Logic
                    const usage = client.usage || 0;
                    let linkColor = isWifi ? '#60a5fa' : '#10b981'; // Default Blue/Green
                    let linkStatus = 'Normal';
                    
                    if (client.blocked) {
                        linkColor = '#94a3b8'; // Gray
                        linkStatus = 'Blocked';
                    } else if (usage > 80) {
                        linkColor = '#ef4444'; // Red (Congested)
                        linkStatus = 'Congested';
                    } else if (usage > 50) {
                        linkColor = '#f59e0b'; // Orange (Busy)
                        linkStatus = 'Busy';
                    }

                    const pathId = `link-path-${clientNode.id}`;
                    
                    return (
                        <g key={`link-${clientNode.id}`}>
                            <path 
                                id={pathId}
                                d={`M ${nodes.router.x} ${nodes.router.y} C ${nodes.router.x} ${(nodes.router.y + clientNode.y)/2}, ${clientNode.x} ${(nodes.router.y + clientNode.y)/2}, ${clientNode.x} ${clientNode.y}`}
                                fill="none"
                                stroke={linkColor}
                                strokeWidth={usage > 50 ? "0.8" : "0.4"}
                                strokeDasharray={isWifi ? "1,1" : ""} 
                                className="opacity-60 transition-all duration-300"
                            />
                            
                            {/* Logical Link Info Label */}
                            {client.status === 'online' && !client.blocked && (
                                <text fontSize="2" fill={linkColor} dy="-1">
                                    <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                                        {linkSpeed} • {vlan} • Loss: {packetLoss}
                                    </textPath>
                                </text>
                            )}

                            {/* Packet Animation */}
                            {client.status === 'online' && !client.blocked && (
                                <circle r={usage > 50 ? "0.8" : "0.6"} fill={linkColor}>
                                    <animateMotion 
                                        dur={`${Math.max(0.5, 2 - (usage / 100))}s`} // Faster if higher usage
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
                onContextMenu={(e) => handleContextMenu(e, 'internet')}
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
                onContextMenu={(e) => handleContextMenu(e, 'router')}
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
                 if (!client) return null;
                 return (
                     <div 
                        key={node.id} 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-help z-10 flex flex-col items-center group" 
                        style={{ left: `${node.x}%`, top: `${node.y}%` }} 
                        onMouseEnter={() => setHoveredNode({ type: 'clients', id: node.id })}
                        onMouseLeave={() => setHoveredNode(null)}
                        onContextMenu={(e) => handleContextMenu(e, 'clients', node.id)}
                     >
                        <div className={`relative p-2.5 rounded-xl shadow-md border transition-all duration-300 ${
                            client.blocked 
                                ? 'bg-red-50 border-red-200 grayscale' 
                                : client.priority === 'high'
                                    ? 'bg-white dark:bg-slate-800 border-yellow-400 ring-2 ring-yellow-400/20 shadow-yellow-200'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 group-hover:-translate-y-1 group-hover:shadow-lg'
                        }`}>
                           {/* Priority Star */}
                           {client.priority === 'high' && !client.blocked && (
                               <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 shadow-sm">
                                   <Zap size={8} fill="currentColor" />
                               </div>
                           )}

                           {client.type === 'wifi' ? (
                               <Smartphone className={`w-6 h-6 ${client.status === 'online' ? 'text-blue-500' : 'text-slate-400'}`} />
                           ) : (
                               <Laptop className={`w-6 h-6 ${client.status === 'online' ? 'text-emerald-500' : 'text-slate-400'}`} />
                           )}
                        </div>
                        
                        {/* Live Bandwidth Badge */}
                        {client.status === 'online' && !client.blocked && (
                            <div className="absolute -right-8 top-0 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {client.usage || Math.floor(Math.random()*20)} Mbps
                            </div>
                        )}
                        
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
    <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} 
        className={`group w-[calc(100%-1rem)] mx-2 flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-lg mb-1 ${
            activeTab === id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
    >
      <Icon className={`h-5 w-5 transition-colors ${activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
      {label}
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

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-shrink-0"><Globe className="h-6 w-6 text-blue-600 mr-2" /><span className="text-xl font-bold text-slate-800 dark:text-white">NetAdmin<span className="text-blue-600">Pro</span></span></div>
        <nav className="mt-6 flex flex-col gap-1 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          <SidebarItem id="dashboard" label="Dashboard" icon={Activity} />
          <SidebarItem id="topology" label="Topology Map" icon={Share2} />
          <SidebarItem id="diagnostics" label="Diagnostics" icon={Gauge} />
          <SidebarItem id="logs" label="System Logs" icon={ClipboardList} />
          <SidebarItem id="network" label="Network" icon={Globe} />
          <SidebarItem id="wireless" label="Wireless" icon={Wifi} />
          <SidebarItem id="clients" label="Clients" icon={Smartphone} />
          <SidebarItem id="qos" label="Traffic & QoS" icon={BarChart2} />
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
             
             {/* Notification Center */}
             <div className="relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                    className="relative text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <div className="relative">
                        <Bell className="h-5 w-5" />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white dark:border-slate-900">
                                {notifications.filter(n => !n.read).length}
                            </span>
                        )}
                    </div>
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-up origin-top-right" onClick={(e) => e.stopPropagation()}>
                        <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Notifications</h3>
                            <button onClick={() => setNotifications([])} className="text-xs text-blue-500 hover:text-blue-700">Clear All</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">No new notifications</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className={`p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <div className="flex gap-3">
                                            <div className={`mt-1 p-1.5 rounded-full h-fit ${
                                                n.type === 'danger' ? 'bg-red-100 text-red-600' : 
                                                n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                                                n.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {n.type === 'danger' ? <AlertOctagon size={14}/> : n.type === 'warning' ? <AlertTriangle size={14}/> : <Activity size={14}/>}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
             </div>

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
                       <div className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{session?.user ? session.user.charAt(0).toUpperCase() + session.user.slice(1) : 'User'}</div>
                       <div className="text-[10px] text-green-500">Logged In</div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs shadow-inner ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                        {session?.user ? session.user.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                 </div>
                 
                 {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-fade-in-down origin-top-right">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{session?.role ? session.role.charAt(0).toUpperCase() + session.role.slice(1) : 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{session?.user || 'user'}@local</p>
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
           {activeTab === 'diagnostics' && renderDiagnostics()}
           {activeTab === 'logs' && renderLogs()}
           {activeTab === 'network' && renderNetwork()}
           {activeTab === 'wireless' && renderWireless()}
           {activeTab === 'clients' && renderClients()}
           {activeTab === 'qos' && renderQoS()}
           {activeTab === 'storage' && renderStorage()}
           {activeTab === 'vpn' && renderVPN()} 
           {activeTab === 'security' && renderSecurity()} 
           {activeTab === 'tools' && renderTools()}
        </div>
      </main>
      
      {/* Config Apply Bar */}
      {isConfigDirty && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white p-4 shadow-lg z-50 flex justify-between items-center animate-fade-in-up border-t border-slate-700">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-500"><AlertTriangle size={20} /></div>
                  <div>
                      <div className="font-bold">Unsaved Changes</div>
                      <div className="text-xs text-slate-400">Configuration has been modified but not applied.</div>
                  </div>
              </div>
              <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => {
                      setConfig(lastAppliedConfig);
                      setIsConfigDirty(false);
                      showToast('Changes discarded', 'info');
                  }}>Discard</Button>
                  <Button onClick={handleApplyConfig}>Apply Changes</Button>
              </div>
          </div>
      )}

      {/* Rollback Modal */}
      {showRollbackModal && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full p-6 text-center border border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Confirm Settings</h3>
                  <p className="text-slate-500 mb-6">
                      New settings have been applied. If you do not confirm, the system will revert in <span className="font-bold text-slate-800 dark:text-white text-lg">{rollbackTimer}s</span> to prevent lockout.
                  </p>
                  <Button className="w-full justify-center py-3 text-lg" onClick={confirmConfig}>
                      Keep Changes
                  </Button>
                  <button onClick={revertConfig} className="mt-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline">
                      Revert Now
                  </button>
              </div>
          </div>
      )}

      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" />}
    </div>
  );
}