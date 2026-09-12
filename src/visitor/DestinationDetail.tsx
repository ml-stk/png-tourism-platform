import { ArrowLeft, ExternalLink } from 'lucide-react';

type Props = { destinationId: string; onBack: () => void };

export default function DestinationDetail({ onBack }: Props) {
  return <section className="rounded-[2rem] border border-white/10 bg-[#071b2a] p-8 text-white shadow-2xl">
    <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16}/> Back to destinations</button>
    <h2 className="text-3xl font-black">Destination guides have moved</h2>
    <p className="mt-3 max-w-2xl text-slate-300">Destination discovery now takes visitors directly to the official Papua New Guinea destination guide, where the latest destination information, experiences and travel details are maintained.</p>
    <a href="https://papuanewguinea.travel/where-to-go/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#a8f17a] px-5 py-3 text-sm font-black text-[#071b2a]">Open official destination guides <ExternalLink size={16}/></a>
  </section>;
}
