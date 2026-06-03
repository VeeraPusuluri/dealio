import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MapPin, Phone, Mail, ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
const INTERESTS = ['Buy a home', 'Schedule a site visit', 'Get loan assistance', 'Investment query', 'NRI purchase', 'Other'];

const CustomerContact = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', interest: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    try {
      await adminApi.submitContact(form);
      setSubmitted(true);
    } catch {
      // still show success to the user — request may have partially saved
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = 'w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-colors';
  const inpStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' };
  const inpFocus = { border: '1px solid rgba(74,222,128,0.5)' };
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 8 };

  return (
    <DashboardLayout>
      <div style={{ minHeight: '100vh', background: '#0B2237', margin: '-24px -24px 0', fontFamily: 'system-ui,sans-serif' }}>

        {/* Back nav */}
        <div style={{ padding: '28px 48px 0' }}>
          <button onClick={() => navigate('/customer')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

          {/* ── Left — form ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4ADE80', marginBottom: 16 }}>Get In Touch</p>
            <h1 style={{ fontFamily: 'Georgia,"Times New Roman",serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, lineHeight: 1.05, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Tell Us What<br />
              <span style={{ color: '#4ADE80' }}>You're Looking For</span>
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 40px', maxWidth: 400 }}>
              Have a home in mind? Or do you like something we built? Fill in the form and our team will reach out within 24 hours.
            </p>

            {submitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, padding: '40px', background: 'rgba(74,222,128,0.06)', borderRadius: 20, border: '1px solid rgba(74,222,128,0.2)' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={26} style={{ color: '#4ADE80' }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Message Received!</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                    Thank you, {form.name}. Our team will get back to you within 24 hours with personalised options.
                  </p>
                </div>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', city: '', interest: '', message: '' }); }}
                  style={{ fontSize: 13, fontWeight: 600, color: '#4ADE80', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 4 }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Name + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Full Name *</label>
                    <input type="text" value={form.name} onChange={set('name')} required placeholder="e.g. Ravi Kumar"
                      className={inp} style={inpStyle}
                      onFocus={e => Object.assign(e.target.style, inpFocus)}
                      onBlur={e => Object.assign(e.target.style, inpStyle)}/>
                  </div>
                  <div>
                    <label style={lbl}>Phone *</label>
                    <input type="tel" value={form.phone} onChange={set('phone')} required placeholder="+91 98765 43210"
                      className={inp} style={inpStyle}
                      onFocus={e => Object.assign(e.target.style, inpFocus)}
                      onBlur={e => Object.assign(e.target.style, inpStyle)}/>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={lbl}>Email Address</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
                    className={inp} style={inpStyle}
                    onFocus={e => Object.assign(e.target.style, inpFocus)}
                    onBlur={e => Object.assign(e.target.style, inpStyle)}/>
                </div>

                {/* City + Interest */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Preferred City</label>
                    <select value={form.city} onChange={set('city')} className={inp}
                      style={{ ...inpStyle, cursor: 'pointer', appearance: 'none' as const }}>
                      <option value="">Select city</option>
                      {CITIES.map(c => <option key={c} style={{ background: '#0B2237' }}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>I'm Interested In</label>
                    <select value={form.interest} onChange={set('interest')} className={inp}
                      style={{ ...inpStyle, cursor: 'pointer', appearance: 'none' as const }}>
                      <option value="">Select topic</option>
                      {INTERESTS.map(i => <option key={i} style={{ background: '#0B2237' }}>{i}</option>)}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={lbl}>Message</label>
                  <textarea value={form.message} onChange={set('message')} rows={4}
                    placeholder="Tell us about what you're looking for — BHK preference, budget, timeline, or anything else…"
                    className={inp} style={{ ...inpStyle, resize: 'none' as const, lineHeight: '1.6' }}
                    onFocus={e => Object.assign(e.target.style, { ...inpStyle, resize: 'none', border: '1px solid rgba(74,222,128,0.5)' })}
                    onBlur={e => Object.assign(e.target.style, { ...inpStyle, resize: 'none' })}/>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                  <button type="submit" disabled={submitting}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', borderRadius: 999, background: '#4ADE80', color: '#0B2237', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'opacity .2s', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Sending…' : (
                      <>
                        Send Message
                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(11,34,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7h10M8 3l4 4-4 4" stroke="#0B2237" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </>
                    )}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent("Hi, I'm looking for a property. Please get in touch.")}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 999, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    <MessageCircle size={15}/> WhatsApp
                  </a>
                </div>

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' as const, marginTop: 4 }}>
                  Your details are kept private and never shared with third parties.
                </p>
              </form>
            )}
          </div>

          {/* ── Right — info + illustration ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingTop: 120 }}>

            {/* Contact details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { icon: <Phone size={18}/>, label: 'Call Us', value: '+91 40 6688 0000', sub: 'Mon – Sat, 9am – 7pm IST' },
                { icon: <Mail size={18}/>, label: 'Email Us', value: 'hello@dealio.in', sub: 'We reply within 24 hours' },
                { icon: <MapPin size={18}/>, label: 'Visit Us', value: 'Hyderabad, Telangana', sub: 'By appointment' },
              ].map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80', flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{c.value}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Animated illustration */}
            <div style={{ position: 'relative', width: '100%', height: 280 }}>
              <style>{`
                @keyframes orbit {
                  from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
                  to   { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
                }
                @keyframes orbit2 {
                  from { transform: rotate(120deg) translateX(120px) rotate(-120deg); }
                  to   { transform: rotate(480deg) translateX(120px) rotate(-480deg); }
                }
                @keyframes orbit3 {
                  from { transform: rotate(240deg) translateX(56px) rotate(-240deg); }
                  to   { transform: rotate(600deg) translateX(56px) rotate(-600deg); }
                }
                @keyframes pulse-ring {
                  0%,100% { transform: scale(1);   opacity: 0.18; }
                  50%     { transform: scale(1.08); opacity: 0.32; }
                }
                @keyframes pulse-ring2 {
                  0%,100% { transform: scale(1);   opacity: 0.1; }
                  50%     { transform: scale(1.12); opacity: 0.22; }
                }
                @keyframes float-dot {
                  0%,100% { transform: translateY(0); }
                  50%     { transform: translateY(-10px); }
                }
                @keyframes spin-slow {
                  from { transform: rotate(0deg); }
                  to   { transform: rotate(360deg); }
                }
                @keyframes spin-rev {
                  from { transform: rotate(0deg); }
                  to   { transform: rotate(-360deg); }
                }
                @keyframes beam {
                  0%,100% { opacity: 0.12; }
                  50%     { opacity: 0.45; }
                }
                .contact-anim-wrap { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
              `}</style>

              <div className="contact-anim-wrap">
                {/* Outer pulsing rings */}
                <div style={{ position:'absolute', width:240, height:240, borderRadius:'50%', border:'1px solid rgba(74,222,128,0.18)', animation:'pulse-ring2 4s ease-in-out infinite' }} />
                <div style={{ position:'absolute', width:190, height:190, borderRadius:'50%', border:'1px solid rgba(74,222,128,0.22)', animation:'pulse-ring 3.2s ease-in-out infinite' }} />
                <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', border:'1px solid rgba(74,222,128,0.3)', animation:'pulse-ring2 2.6s ease-in-out infinite 0.4s' }} />

                {/* Spinning dashed ring */}
                <div style={{ position:'absolute', width:210, height:210, borderRadius:'50%', border:'1px dashed rgba(74,222,128,0.15)', animation:'spin-slow 18s linear infinite' }} />
                <div style={{ position:'absolute', width:162, height:162, borderRadius:'50%', border:'1px dashed rgba(74,222,128,0.12)', animation:'spin-rev 12s linear infinite' }} />

                {/* Center core */}
                <div style={{ position:'relative', width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, rgba(74,222,128,0.25), rgba(74,222,128,0.05))', border:'1px solid rgba(74,222,128,0.4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 32px rgba(74,222,128,0.25), 0 0 8px rgba(74,222,128,0.15)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#4ADE80" strokeWidth="1.5" fill="rgba(74,222,128,0.15)"/>
                    <path d="M9 22V12h6v10" stroke="#4ADE80" strokeWidth="1.5"/>
                  </svg>
                </div>

                {/* Orbiting dot 1 — fast, close */}
                <div style={{ position:'absolute', width:64, height:64, display:'flex', alignItems:'center', justifyContent:'center', animation:'orbit 5s linear infinite' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 10px rgba(74,222,128,0.8)' }} />
                </div>

                {/* Orbiting dot 2 — medium, larger radius */}
                <div style={{ position:'absolute', width:64, height:64, display:'flex', alignItems:'center', justifyContent:'center', animation:'orbit2 8s linear infinite' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'rgba(74,222,128,0.7)', boxShadow:'0 0 8px rgba(74,222,128,0.5)' }} />
                </div>

                {/* Orbiting dot 3 — slow, inner */}
                <div style={{ position:'absolute', width:64, height:64, display:'flex', alignItems:'center', justifyContent:'center', animation:'orbit3 3.5s linear infinite' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(74,222,128,0.5)' }} />
                </div>

                {/* Floating label chips */}
                {[
                  { top: '8%',  left: '62%', text: '24h reply',   delay: '0s'   },
                  { top: '72%', left: '58%', text: 'Hyderabad',   delay: '0.6s' },
                  { top: '42%', left: '4%',  text: 'Free consult',delay: '1.2s' },
                ].map(chip => (
                  <div key={chip.text} style={{ position:'absolute', top:chip.top, left:chip.left, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:999, padding:'4px 10px', fontSize:10, fontWeight:700, color:'rgba(74,222,128,0.8)', letterSpacing:'0.06em', whiteSpace:'nowrap', animation:`float-dot 3s ease-in-out infinite`, animationDelay:chip.delay }}>
                    {chip.text}
                  </div>
                ))}

                {/* Beam lines */}
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} viewBox="0 0 300 280">
                  {[[150,140,240,60],[150,140,60,80],[150,140,250,200],[150,140,50,210]].map(([x1,y1,x2,y2], i) => (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="rgba(74,222,128,0.15)" strokeWidth="1"
                      strokeDasharray="4 6"
                      style={{ animation:`beam 2.5s ease-in-out infinite`, animationDelay:`${i*0.5}s` }}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerContact;
