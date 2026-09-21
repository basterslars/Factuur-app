import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer (via pdfkit/fontkit) laadt standaardlettertypen op
  // basis van bestandspad met dynamische requires. Als Next dit meebundelt
  // breekt dat pad-gebaseerde laden -- door deze packages als "server
  // external" te markeren blijven ze gewoon vanuit node_modules ingeladen.
  serverExternalPackages: ["@react-pdf/renderer", "pdfkit", "fontkit"],
};

export default nextConfig;
