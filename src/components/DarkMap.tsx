import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Jaipur coordinates
const JAIPUR: [number, number] = [26.9124, 75.7873];

// Custom glowing marker that matches the portfolio's primary accent
const accentIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <span style="
        position:absolute;inset:0;border-radius:9999px;
        background:hsl(var(--primary));
        box-shadow:0 0 0 6px hsl(var(--primary)/0.25),0 0 14px 4px hsl(var(--primary)/0.6);
      "></span>
      <span style="
        position:absolute;inset:6px;border-radius:9999px;background:#fff;
      "></span>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

const DarkMap = () => {
  return (
    <div className="relative z-0 isolate overflow-hidden rounded-lg border border-primary/20">
      <MapContainer
        center={JAIPUR}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "200px", width: "100%", background: "#0b0b0f" }}
        attributionControl={false}
      >
        {/* CartoDB Dark Matter — a genuinely dark-designed tile set */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={20}
        />
        <Marker position={JAIPUR} icon={accentIcon}>
          <Popup>Jaipur, Rajasthan, India</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default DarkMap;
