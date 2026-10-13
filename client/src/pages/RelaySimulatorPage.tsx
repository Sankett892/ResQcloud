import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Car,
  TowerControl,
  Server,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Send,
  Zap,
} from 'lucide-react';

interface SimulationLog {
  id: string;
  timestamp: string;
  node: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export const RelaySimulatorPage: React.FC = () => {
  // Simulation States
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentHop, setCurrentHop] = useState<number>(0); // 0 = Idle, 1 = Node A, 2 = Node B, 3 = Gateway, 4 = Cloud Server
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 4x

  // Network Conditions
  const [directInternetActive, setDirectInternetActive] = useState(false);
  const [nodeAActive, setNodeAActive] = useState(true);
  const [nodeBActive, setNodeBActive] = useState(true);
  const [gatewayActive, setGatewayActive] = useState(true);

  // Packet Payload
  const [packetPayload, setPacketPayload] = useState({
    packetId: 'SYNTH-SOS-9821',
    source: 'Citizen Smartphone (Sector 4 Flood Zone)',
    disaster: 'FLOOD',
    severity: 'CRITICAL',
    payloadBytes: 128,
    hopCount: 0,
    hopsRemaining: 4,
    deliveryStatus: 'PENDING_TRANSMISSION',
  });

  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const timerRef = useRef<any>(null);

  const addLog = (node: string, message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const newLog: SimulationLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      node,
      message,
      type,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const resetSimulation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setCurrentHop(0);
    setPacketPayload((prev) => ({
      ...prev,
      hopCount: 0,
      hopsRemaining: 4,
      deliveryStatus: 'PENDING_TRANSMISSION',
    }));
    addLog('SYSTEM', 'Simulation reset to source state.', 'info');
  };

  const startSimulation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentHop(0);

    setLogs([]);
    addLog('SOURCE', `Synthetic SOS packet generated: ${packetPayload.packetId} (Payload: ${packetPayload.payloadBytes} bytes).`, 'info');

    advanceSimulationStep(1);
  };

  const advanceSimulationStep = (targetHop: number) => {
    const delay = 1800 / simulationSpeed;

    timerRef.current = setTimeout(() => {
      // Step 1: Citizen -> Relay Node A
      if (targetHop === 1) {
        if (!nodeAActive) {
          addLog('NODE A', 'Relay Node A is OFFLINE or unreachable. Message buffered at Source Device awaiting carrier beacon.', 'warn');
          setCurrentHop(0);
          setPacketPayload((p) => ({ ...p, deliveryStatus: 'STALLED_AT_SOURCE' }));
          setIsRunning(false);
          return;
        }

        setCurrentHop(1);
        setPacketPayload((p) => ({ ...p, hopCount: 1, hopsRemaining: 3, deliveryStatus: 'FORWARDING_HOP_1' }));
        addLog('RELAY A', 'Hop 1: Packet received by Volunteer Peer Device via BLE Mesh beacon.', 'success');
        advanceSimulationStep(2);
      }
      // Step 2: Relay Node A -> Relay Node B (Emergency Vehicle)
      else if (targetHop === 2) {
        if (!nodeBActive) {
          addLog('NODE B', 'Relay Node B (Emergency Vehicle) is OUT OF RANGE. Message buffered in Relay Node A store-and-forward storage.', 'warn');
          setCurrentHop(1);
          setPacketPayload((p) => ({ ...p, deliveryStatus: 'BUFFERED_AT_HOP_1' }));
          setIsRunning(false);
          return;
        }

        setCurrentHop(2);
        setPacketPayload((p) => ({ ...p, hopCount: 2, hopsRemaining: 2, deliveryStatus: 'FORWARDING_HOP_2' }));
        addLog('RELAY B', 'Hop 2: Packet forwarded to First Responder Patrol Vehicle over Wi-Fi Aware 5GHz link.', 'success');
        advanceSimulationStep(3);
      }
      // Step 3: Relay Node B -> Connected Gateway
      else if (targetHop === 3) {
        if (!gatewayActive) {
          addLog('GATEWAY', 'Local SATCOM / VHF Gateway is DISRUPTED or lost power. Packet retained in Vehicle DTN queue.', 'error');
          setCurrentHop(2);
          setPacketPayload((p) => ({ ...p, deliveryStatus: 'BUFFERED_AT_HOP_2' }));
          setIsRunning(false);
          return;
        }

        setCurrentHop(3);
        setPacketPayload((p) => ({ ...p, hopCount: 3, hopsRemaining: 1, deliveryStatus: 'REACHED_GATEWAY' }));
        addLog('GATEWAY', 'Hop 3: Packet delivered to Solar Cellular / Satellite Gateway tower.', 'success');
        advanceSimulationStep(4);
      }
      // Step 4: Gateway -> Cloud Dispatch Server
      else if (targetHop === 4) {
        setCurrentHop(4);
        setPacketPayload((p) => ({ ...p, hopCount: 4, hopsRemaining: 0, deliveryStatus: 'CLOUD_DELIVERY_CONFIRMED' }));
        addLog('CLOUD SERVER', 'Hop 4: Packet injected into ResQCloud Central Dispatch API! Triage ticket acknowledged.', 'success');
        setIsRunning(false);
      }
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Simulation Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>SIMULATED RELAY &bull; CONCEPTUAL DEMONSTRATION MODE</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Multi-Hop Delay-Tolerant Store-and-Forward Simulator
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Demonstrates the architectural concept of multi-hop ad-hoc message forwarding when the source citizen has zero cellular internet connectivity.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
            <div>STATUS: {packetPayload.deliveryStatus}</div>
            <div>CURRENT HOP: {currentHop} / 4</div>
          </div>
        </div>
      </div>

      {/* Control Panel and Simulation Speed */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={startSimulation}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50 shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start Simulation</span>
          </button>

          <button
            onClick={resetSimulation}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Sim Speed:</span>
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimulationSpeed(spd)}
              className={`px-2.5 py-1 rounded font-bold transition ${
                simulationSpeed === spd
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Network Environment Conditions Toggles */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Simulated Network Conditions & Node Availability
          </span>
          <span className="text-[11px] text-slate-500">Toggle node faults to test store-and-forward buffering</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Direct Link */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Direct Cellular</div>
              <div className="text-[10px] text-slate-500">Source to Cloud link</div>
            </div>
            <button
              onClick={() => setDirectInternetActive(!directInternetActive)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                directInternetActive ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {directInternetActive ? 'AVAILABLE' : 'SEVERED'}
            </button>
          </div>

          {/* Node A */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Relay Node A</div>
              <div className="text-[10px] text-slate-500">Volunteer Phone</div>
            </div>
            <button
              onClick={() => setNodeAActive(!nodeAActive)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                nodeAActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
              }`}
            >
              {nodeAActive ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>

          {/* Node B */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Relay Node B</div>
              <div className="text-[10px] text-slate-500">Patrol Vehicle</div>
            </div>
            <button
              onClick={() => setNodeBActive(!nodeBActive)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                nodeBActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
              }`}
            >
              {nodeBActive ? 'IN RANGE' : 'OFFLINE'}
            </button>
          </div>

          {/* Gateway */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">SATCOM Gateway</div>
              <div className="text-[10px] text-slate-500">Uplink Tower</div>
            </div>
            <button
              onClick={() => setGatewayActive(!gatewayActive)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                gatewayActive ? 'bg-emerald-600 text-white' : 'bg-rose-700 text-white'
              }`}
            >
              {gatewayActive ? 'ONLINE' : 'DISRUPTED'}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Multi-Hop Topology Diagram */}
      <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6 text-white overflow-x-auto">
        <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>TOPOLOGY GRAPH: DELAY-TOLERANT NETWORK (DTN)</span>
          <span className="text-cyan-400">HOP COUNT: {packetPayload.hopCount}</span>
        </div>

        {/* Node Pipeline Nodes */}
        <div className="flex items-center justify-between min-w-[700px] relative py-6">
          {/* Connecting Path Line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0" />

          {/* Active Flow Line */}
          <div
            className="absolute top-1/2 left-8 h-1 bg-gradient-to-r from-cyan-500 to-emerald-400 -translate-y-1/2 z-0 transition-all duration-700"
            style={{ width: `${(currentHop / 4) * 90}%` }}
          />

          {/* Node 0: Citizen Device */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                currentHop === 0
                  ? 'bg-red-600/30 border-red-500 shadow-lg shadow-red-900/60 ring-4 ring-red-500/20 scale-105'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <Smartphone className={`w-7 h-7 ${currentHop === 0 ? 'text-red-400' : 'text-slate-400'}`} />
            </div>
            <div className="mt-2 text-xs font-bold">Source Citizen</div>
            <div className="text-[10px] text-slate-400 font-mono">0 Cellular Signal</div>
          </div>

          {/* Node 1: Relay Node A */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                currentHop === 1
                  ? 'bg-cyan-600/30 border-cyan-400 shadow-lg shadow-cyan-900/60 ring-4 ring-cyan-400/20 scale-105'
                  : nodeAActive
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-rose-900/50 text-rose-500 opacity-60'
              }`}
            >
              <Smartphone className="w-7 h-7 text-cyan-400" />
            </div>
            <div className="mt-2 text-xs font-bold">Relay Node A</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {nodeAActive ? 'Volunteer Peer' : 'Peer Offline'}
            </div>
          </div>

          {/* Node 2: Relay Node B */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                currentHop === 2
                  ? 'bg-indigo-600/30 border-indigo-400 shadow-lg shadow-indigo-900/60 ring-4 ring-indigo-400/20 scale-105'
                  : nodeBActive
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-rose-900/50 text-rose-500 opacity-60'
              }`}
            >
              <Car className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="mt-2 text-xs font-bold">Relay Node B</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {nodeBActive ? 'Rescue Vehicle' : 'Vehicle Out of Range'}
            </div>
          </div>

          {/* Node 3: Connected Gateway */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                currentHop === 3
                  ? 'bg-amber-600/30 border-amber-400 shadow-lg shadow-amber-900/60 ring-4 ring-amber-400/20 scale-105'
                  : gatewayActive
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-rose-900 text-rose-500 opacity-60'
              }`}
            >
              <TowerControl className="w-7 h-7 text-amber-400" />
            </div>
            <div className="mt-2 text-xs font-bold">SATCOM Gateway</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {gatewayActive ? 'Tower Uplink' : 'Gateway Disrupted'}
            </div>
          </div>

          {/* Node 4: Cloud Server */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                currentHop === 4
                  ? 'bg-emerald-600/30 border-emerald-400 shadow-lg shadow-emerald-900/60 ring-4 ring-emerald-400/20 scale-105'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <Server className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="mt-2 text-xs font-bold">ResQCloud API</div>
            <div className="text-[10px] text-emerald-400 font-mono">Central Dispatch</div>
          </div>
        </div>

        {/* Packet Information Card */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div>
            <div className="text-slate-400 text-[10px]">PACKET ID</div>
            <div className="text-cyan-300 font-bold">{packetPayload.packetId}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px]">PAYLOAD TYPE</div>
            <div className="text-red-400 font-bold">{packetPayload.disaster} ({packetPayload.severity})</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px]">HOPS REMAINING</div>
            <div className="text-white font-bold">{packetPayload.hopsRemaining}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px]">DELIVERY STATE</div>
            <div className="text-emerald-400 font-bold">{packetPayload.deliveryStatus}</div>
          </div>
        </div>
      </div>

      {/* Synthetic Transmission Event Log */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-600" />
            Simulation Transmission Event Log
          </span>
          <span className="text-[11px] text-slate-500 font-mono">{logs.length} events logged</span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-mono">
              Press "Start Simulation" to initiate multi-hop forwarding packet dispatch.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-lg border text-xs font-mono flex items-start justify-between gap-3 ${
                  log.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : log.type === 'warn'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : log.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <span className="font-bold mr-2">[{log.node}]</span>
                  <span>{log.message}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Educational Limitations Explanation */}
      <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs space-y-2">
        <div className="font-bold flex items-center gap-2 text-cyan-300">
          <Info className="w-4 h-4" />
          <span>Real-World Physical Implementation Requirements</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          In a physical disaster response system, genuine device-to-device multi-hop mesh forwarding requires hardware-level Bluetooth Low Energy (BLE) peripheral background scanning or Wi-Fi Direct (P2P) radio daemon services installed natively on mobile devices.
        </p>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Standard browser security sandboxes prevent web applications from broadcasting raw 802.11 ad-hoc beacons or binding raw sockets without operating system permissions. ResQCloud implements verified IndexedDB offline buffering in the browser, while this simulator provides the visual and architectural specification for accompanying native node software.
        </p>
      </div>
    </div>
  );
};
