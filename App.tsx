
import React, { useEffect, useRef, useState } from 'react';
import up1Image from './up1.jpeg';
import up2Image from './up2.jpeg';
import { 
  Star, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Headphones, 
  Clock, 
  ChevronDown, 
  Play, 
  Volume2, 
  Gift, 
  Award, 
  Users,
  Package,
  Menu,
  X,
  ShoppingCart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MapPin,
  UserCircle2,
  Copy,
  QrCode,
  CreditCard
} from 'lucide-react';

// --- Helper Components ---

const Ticker = () => {
  const items = [
    "ENVIO RÁPIDO PARA TODO BRASIL",
    "GARANTIA DE ENTREGA VIVA",
    "SUPORTE 7 DIAS POR SEMANA",
    "FRETE GRÁTIS PARA KIT EM DOBRO",
    "PAGAMENTO SEGURO"
  ];
  return (
    <div className="bg-white py-2 border-y border-gray-100 ticker-wrap relative">
      <div className="ticker flex gap-8 items-center">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const FAQAccordion = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-4 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full justify-between items-center text-left focus:outline-none bg-[#F39C12] hover:bg-[#E67E22] transition-colors py-4 px-6 rounded-xl shadow-sm"
      >
        <span className="text-lg font-bold text-black">{question}</span>
        <div className="shrink-0">
          {isOpen ? (
            <ChevronDown className="w-6 h-6 text-black" />
          ) : (
            <ChevronRight className="w-6 h-6 text-black" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="bg-white p-6 rounded-b-xl border-x border-b border-gray-100 text-gray-700 leading-relaxed animate-fadeIn -mt-2 pt-8">
          {answer}
        </div>
      )}
    </div>
  );
};

type CheckoutKit = 'simples' | 'dobro';
type CartKitItem = { kit: CheckoutKit; quantity: number };

interface CheckoutModalProps {
  kit: CheckoutKit;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ kit, onClose }) => {
  const [selectedFrete, setSelectedFrete] = useState<'correios' | 'jalog' | 'gratis'>(kit === 'dobro' ? 'gratis' : 'jalog');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfTouched, setCpfTouched] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fertiPlus, setFertiPlus] = useState(false);
  const [kitBonus, setKitBonus] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCardError, setShowCardError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccessMessage, setApiSuccessMessage] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(12 * 60 + 54);
  const [copied, setCopied] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
  };

  const formatCardExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const formatCardCvv = (value: string) => value.replace(/\D/g, '').slice(0, 4);

  const toDigits = (value: string) => value.replace(/\D/g, '');

  const validateCpf = (digits: string) => {
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calcDigit = (base: string, factor: number) => {
      let total = 0;
      for (const char of base) {
        total += Number(char) * factor;
        factor -= 1;
      }
      const remainder = (total * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    const digit1 = calcDigit(digits.slice(0, 9), 10);
    const digit2 = calcDigit(digits.slice(0, 10), 11);

    return digit1 === Number(digits[9]) && digit2 === Number(digits[10]);
  };

  useEffect(() => {
    const cepDigits = cep.replace(/\D/g, '');

    if (cepDigits.length !== 8) {
      setCepStatus('idle');
      return;
    }

    let isCancelled = false;
    setCepStatus('loading');
    const fetchAddress = async () => {
      let foundAddress = false;

      try {
        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        if (viaCepResponse.ok) {
          const viaCepData = await viaCepResponse.json();
          if (!viaCepData?.erro) {
            if (isCancelled) return;
            setLogradouro(viaCepData.logradouro ?? '');
            setBairro(viaCepData.bairro ?? '');
            setCidade(viaCepData.localidade ?? '');
            setEstado(viaCepData.uf ?? '');
            setCepStatus('success');
            foundAddress = true;
            return;
          }
        }
      } catch {
        // ViaCEP indisponível: tenta o fallback abaixo.
      }

      if (foundAddress) return;

      try {
        const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepDigits}`);
        if (!brasilApiResponse.ok) {
          throw new Error('CEP não encontrado');
        }
        const brasilApiData = await brasilApiResponse.json();
        if (isCancelled) return;
        setLogradouro(brasilApiData.street ?? '');
        setBairro(brasilApiData.neighborhood ?? '');
        setCidade(brasilApiData.city ?? '');
        setEstado(brasilApiData.state ?? '');
        setCepStatus('success');
      } catch {
        if (!isCancelled) setCepStatus('error');
      }
    };

    void fetchAddress();

    return () => {
      isCancelled = true;
    };
  }, [cep]);

  useEffect(() => {
    if (!pixCode) return;

    setCountdownSeconds(12 * 60 + 54);
    const intervalId = window.setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [pixCode]);

  const isKitDobro = kit === 'dobro';
  const unitPrice = isKitDobro ? 87.4 : 59.9;
  const basePrice = unitPrice * quantity;
  const effectiveFrete = isKitDobro ? 'gratis' : selectedFrete;
  const fretePrice = effectiveFrete === 'correios' ? 16.93 : effectiveFrete === 'jalog' ? 9.94 : 0;
  const hasCep = toDigits(cep).length >= 8;
  const freteTotal = effectiveFrete === 'gratis' ? 0 : (hasCep ? fretePrice : 0);
  const total = basePrice + freteTotal + (fertiPlus ? 12.9 : 0) + (kitBonus ? 29.9 : 0);
  const kitTitle = isKitDobro ? 'Kit em Dobro - Colecao 5 Cores Raras' : 'Kit Simples - Colecao 5 Cores Raras';
  const kitImage = isKitDobro ? 'https://i.ibb.co/gLSx40L4/Group-1105.png' : 'https://i.ibb.co/N2Fvzfpn/Oferta-1.png';
  const currentCpfDigits = toDigits(cpf);
  const isCpfValid = validateCpf(currentCpfDigits);
  const showCpfInvalid = cpfTouched && currentCpfDigits.length === 11 && !isCpfValid;
  const firstName = nome.trim().split(' ')[0] || 'cliente';
  const minutesLeft = Math.floor(countdownSeconds / 60).toString().padStart(2, '0');
  const secondsLeft = (countdownSeconds % 60).toString().padStart(2, '0');
  const progressPercent = Math.max(0, (countdownSeconds / (12 * 60 + 54)) * 100);
  const pixPreview = pixCode
    ? `${pixCode.slice(0, 26)}...${pixCode.slice(-16)}`
    : 'Código PIX não retornado automaticamente.';
  const pixQrCodeUrl = pixCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixCode)}`
    : '';

  useEffect(() => {
    if (isKitDobro) {
      setSelectedFrete('gratis');
      return;
    }

    if (selectedFrete === 'gratis') {
      setSelectedFrete('jalog');
    }
  }, [isKitDobro]);

  const handleCopyPixCode = async () => {
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setApiError('Não foi possível copiar o código automaticamente.');
    }
  };

  const handleCreatePixCharge = async () => {
    setApiError('');
    setApiSuccessMessage('');
    setPixCode('');
    setPedidoConfirmado(false);

    if (paymentMethod === 'card') {
      setShowCardError(true);
      return;
    }

    const cpfDigits = toDigits(cpf);
    const phoneDigits = toDigits(telefone);
    const cepDigits = toDigits(cep);

    if (!nome.trim() || !email.trim()) {
      setApiError('Preencha nome e e-mail para continuar.');
      return;
    }
    if (cpfDigits.length !== 11) {
      setCpfTouched(true);
      setApiError('CPF inválido. Confira os 11 dígitos.');
      return;
    }
    if (!validateCpf(cpfDigits)) {
      setCpfTouched(true);
      setApiError('CPF inválido. Verifique e tente novamente.');
      return;
    }
    if (phoneDigits.length < 10) {
      setApiError('Telefone inválido.');
      return;
    }
    if (cepDigits.length !== 8) {
      setApiError('Preencha um CEP válido para calcular o frete.');
      return;
    }
    if (!logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
      setApiError('Complete o endereço de entrega.');
      return;
    }

    const token = import.meta.env.VITE_FRUITFY_API_TOKEN as string | undefined;
    const storeId = import.meta.env.VITE_FRUITFY_STORE_ID as string | undefined;
    const productId = import.meta.env.VITE_FRUITFY_PRODUCT_ID as string | undefined;

    if (!token || !storeId || !productId) {
      setApiError('Configuração da Fruitfy ausente. Verifique as variáveis no arquivo .env.');
      return;
    }

    const utmParams = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: utmParams.get('utm_source') ?? undefined,
      utm_medium: utmParams.get('utm_medium') ?? undefined,
      utm_campaign: utmParams.get('utm_campaign') ?? undefined,
      utm_content: utmParams.get('utm_content') ?? undefined,
      utm_term: utmParams.get('utm_term') ?? undefined
    };
    const cleanedUtm = Object.fromEntries(Object.entries(utm).filter(([, value]) => Boolean(value)));

    const payload = {
      name: nome.trim(),
      email: email.trim(),
      phone: phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`,
      cpf: cpfDigits,
      items: [
        {
          id: productId,
          value: Math.round(total * 100),
          quantity: 1
        }
      ],
      ...(Object.keys(cleanedUtm).length > 0 ? { utm: cleanedUtm } : {})
    };

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.fruitfy.io/api/pix/charge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Store-Id': storeId,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        const message = result?.message || 'Não foi possível criar a cobrança PIX.';
        throw new Error(message);
      }

      setPedidoConfirmado(true);
      setApiSuccessMessage(result?.message || 'Cobrança PIX criada com sucesso.');
      const findPixCode = (value: unknown): string => {
        if (typeof value === 'string') {
          return value.startsWith('000201') ? value : '';
        }
        if (!value || typeof value !== 'object') return '';
        for (const entry of Object.values(value as Record<string, unknown>)) {
          const found = findPixCode(entry);
          if (found) return found;
        }
        return '';
      };

      const returnedPixCode =
        result?.data?.pix_code ||
        result?.data?.pix_copiaecola ||
        result?.data?.pix_copy_paste ||
        result?.data?.pixCopyPaste ||
        result?.data?.pixCode ||
        result?.pix_code ||
        result?.pix_copiaecola ||
        findPixCode(result?.data) ||
        '';
      setPixCode(returnedPixCode);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Erro ao criar cobrança PIX.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCardError) {
    return (
      <div className="bg-gray-50 min-h-screen py-10 flex items-center px-4">
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
            <div className="bg-red-50 p-8 flex items-center gap-6 border-b border-red-100">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500 flex-shrink-0">
                <X className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight">CARTAO NEGADO</h2>
                <p className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest">Problema na autenticacao bancaria</p>
              </div>
            </div>
            <div className="p-8 md:p-12 space-y-8">
              <p className="text-gray-600 text-sm md:text-base font-medium leading-relaxed">
                Houve um erro no processamento do seu cartao de credito.
                <br />
                Para garantir sua reserva imediata com frete gratis, sugerimos finalizar via <span className="text-green-600 font-black">PIX</span>.
              </p>
              <button
                onClick={() => {
                  setPaymentMethod('pix');
                  setShowCardError(false);
                }}
                className="w-full bg-green-600 text-white py-5 font-black uppercase tracking-[0.2em] text-xs hover:bg-green-700 transition-all rounded-xl shadow-xl active:scale-95"
              >
                PAGAR COM PIX AGORA
              </button>
              <button
                onClick={() => setShowCardError(false)}
                className="w-full text-gray-400 py-2 font-black uppercase tracking-widest text-[9px] hover:text-gray-600"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div>
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-black text-base">
                JC
              </div>
              <span className="text-base font-extrabold text-green-800 tracking-tighter">
                Jardim<span className="text-gray-900">daCida</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Checkout seguro</p>
              <h2 className="text-xl font-black text-[#10233F]">
                {kit === 'dobro' ? 'Kit em Dobro' : 'Kit Simples'}
              </h2>
            </div>
            <button onClick={onClose} className="px-4 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition font-bold text-xs uppercase tracking-widest">
              Voltar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {pedidoConfirmado ? (
              <div className="lg:col-span-12 rounded-2xl overflow-hidden border border-[#0B2445]/10 bg-white">
                <div className="bg-[#0B2445] text-white p-5 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-green-200 font-bold mb-1">Pagamento via PIX</p>
                  <h3 className="text-3xl leading-tight font-extrabold">
                    Falta pouco, {firstName}
                  </h3>
                  <p className="text-sm text-green-100 mt-1">Finalize o pagamento para confirmar seu pedido.</p>
                </div>

                <div className="p-4 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-[#F7FAF8] p-4">
                    <p className="text-sm font-bold text-[#0B2445] mb-2">PIX Copia e Cola (preview)</p>
                    <div className="rounded-lg bg-white border border-gray-200 p-3 text-[11px] text-gray-700 break-all mb-3">
                      {pixPreview}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPixCode}
                      disabled={!pixCode}
                      className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-extrabold text-sm transition flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Código copiado!' : 'Copiar e colar código'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#0B2445]/10 bg-[#EEF5F1] p-3">
                    <p className="text-center text-sm font-semibold text-[#0B2445] mb-2">
                      Sua oferta expira em <span className="font-black">{minutesLeft}:{secondsLeft}</span>
                    </p>
                    <div className="h-2 bg-[#D7E6DC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-lg font-bold text-[#0B2445] mb-3">Como pagar com PIX:</p>
                    <div className="space-y-2 text-sm text-gray-700">
                      {[
                        'Abra o app do seu banco e entre na opção Pix',
                        'Escolha a opção Pagar / Pix copia e cola',
                        'Escaneie o QR Code ou copie e cole o código',
                        'Confirme o pagamento'
                      ].map((step, index) => (
                        <div key={step} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {apiSuccessMessage && (
                    <div className="rounded-xl border border-green-200 bg-green-50 text-green-900 p-3 text-sm font-semibold">
                      {apiSuccessMessage}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
            <div className="lg:col-span-8 space-y-5">
            <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-green-700 rounded-full text-white flex items-center justify-center text-xs font-black">1</div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#0B2445]">Sua Sacola</h3>
              </div>
              <div className="flex gap-4 items-center border border-gray-100 rounded-xl p-3">
                <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-lg p-2 shrink-0">
                  <img src={kitImage} alt={kitTitle} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-700 font-black uppercase tracking-widest mb-1">{isKitDobro ? 'Kit em Dobro' : 'Kit Simples'}</p>
                  <h4 className="text-sm md:text-base font-black text-[#0B2445] leading-tight">{kitTitle}</h4>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 font-black hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-black text-[#0B2445]">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.min(10, prev + 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 font-black hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-black text-[#0B2445]">R$ {basePrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-700 rounded-full text-white flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-3xl md:text-[32px] font-extrabold text-[#0B2445]">Identificacao</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[#0B2445] text-sm font-semibold mb-2">Nome e sobrenome</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-[#0B2445] text-sm font-semibold mb-2">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                    placeholder="voce@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[#0B2445] text-sm font-semibold mb-2">Telefone/WhatsApp</label>
                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-[#0B2445] text-sm font-semibold mb-2">CPF</label>
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    onBlur={() => setCpfTouched(true)}
                    className={`w-full rounded-xl border px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20 ${showCpfInvalid ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    maxLength={14}
                  />
                  {showCpfInvalid && (
                    <p className="mt-2 text-xs font-semibold text-red-500">CPF inválido.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-700 rounded-full text-white flex items-center justify-center text-xs font-black">3</div>
                <h3 className="text-3xl md:text-[32px] font-extrabold text-[#0B2445]">Endereco de Entrega</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[#0B2445] text-sm font-semibold mb-2">CEP</label>
                  <input
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                  />
                  {cepStatus === 'loading' && (
                    <p className="mt-2 text-xs font-semibold text-gray-500">Buscando endereço...</p>
                  )}
                  {cepStatus === 'error' && (
                    <p className="mt-2 text-xs font-semibold text-red-500">CEP não encontrado.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[#0B2445] text-sm font-semibold mb-2">Rua / Logradouro</label>
                  <input
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                    placeholder="Rua Exemplo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#0B2445] text-sm font-semibold mb-2">Número</label>
                    <input
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-[#0B2445] text-sm font-semibold mb-2">Complemento</label>
                    <input
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="Apto / Casa"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#0B2445] text-sm font-semibold mb-2">Bairro</label>
                  <input
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                    placeholder="Seu bairro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#0B2445] text-sm font-semibold mb-2">Cidade</label>
                    <input
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-[#0B2445] text-sm font-semibold mb-2">Estado</label>
                    <input
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-[#F4F5F7] outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="UF"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-200">
                <h4 className="text-3xl md:text-[30px] font-extrabold text-[#0B2445] mb-3">Opções de Frete</h4>

                {!isKitDobro && (
                  <>
                    <label className={`block rounded-xl border p-4 mb-3 cursor-pointer transition ${selectedFrete === 'correios' ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="frete"
                            checked={selectedFrete === 'correios'}
                            onChange={() => setSelectedFrete('correios')}
                            className="w-5 h-5 accent-[#8A3CCF]"
                          />
                          <div>
                            <p className="font-bold text-xl text-[#0B2445]">Correios (Express)</p>
                                <p className="text-gray-500">{hasCep ? '2 - 3 dias' : 'Prazo após CEP'}</p>
                          </div>
                        </div>
                        <p className="font-extrabold text-2xl text-[#0B2445]">
                          {hasCep ? 'R$ 16,93' : 'Informe o CEP'}
                        </p>
                      </div>
                    </label>

                    <label className={`block rounded-xl border p-4 mb-3 cursor-pointer transition ${selectedFrete === 'jalog' ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="frete"
                            checked={selectedFrete === 'jalog'}
                            onChange={() => setSelectedFrete('jalog')}
                            className="w-5 h-5 accent-[#8A3CCF]"
                          />
                          <div>
                            <p className="font-bold text-xl text-[#0B2445]">Jalog Entrega (normal)</p>
                                <p className="text-gray-500">{hasCep ? '7 dias' : 'Prazo após CEP'}</p>
                          </div>
                        </div>
                        <p className="font-extrabold text-2xl text-[#0B2445]">
                          {hasCep ? 'R$ 9,94' : 'Informe o CEP'}
                        </p>
                      </div>
                    </label>
                  </>
                )}

                {isKitDobro && (
                  <label className={`block rounded-xl border p-4 cursor-pointer transition ${effectiveFrete === 'gratis' ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="frete"
                          checked={effectiveFrete === 'gratis'}
                          onChange={() => setSelectedFrete('gratis')}
                          className="w-5 h-5 accent-[#8A3CCF]"
                        />
                        <div>
                          <p className="font-bold text-xl text-[#0B2445]">Frete Grátis</p>
                            <p className="text-gray-500">{hasCep ? '2 a 4 dias' : 'Prazo após CEP'}</p>
                        </div>
                      </div>
                      <p className="font-extrabold text-2xl text-green-700">R$ 0,00</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-700 rounded-full text-white flex items-center justify-center text-xs font-black">4</div>
                <h3 className="text-3xl md:text-[32px] font-extrabold text-[#0B2445]">Pagamento</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-green-600 bg-green-50 text-[#0B2445]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">PIX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-green-600 bg-green-50 text-[#0B2445]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cartao</span>
                </button>
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#F7FAF8] p-4">
                {paymentMethod === 'pix' ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#0B2445] uppercase tracking-wide">Aprovacao prioritaria</p>
                      <p className="text-xs text-gray-600">O QR Code sera gerado no proximo passo.</p>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-black uppercase">PIX</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="Numero do cartao"
                    />
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="Nome no cartao"
                    />
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="MM/AA"
                    />
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(formatCardCvv(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-600/20"
                      placeholder="CVV"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm md:text-base font-black text-amber-800 uppercase tracking-tight">
                  74% das pessoas levam tambem...
                </p>
              </div>

              <label className={`rounded-xl border-2 border-dashed p-4 flex items-start gap-3 cursor-pointer ${fertiPlus ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
                <input type="checkbox" checked={fertiPlus} onChange={(e) => setFertiPlus(e.target.checked)} className="mt-1 w-5 h-5 accent-[#8A3CCF]" />
                <div className="flex-1 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={up1Image}
                      alt="Fertilizante"
                      className="w-16 h-16 rounded-lg border border-gray-200 bg-white object-cover shrink-0"
                    />
                    <div>
                    <p className="text-2xl font-extrabold text-[#0B2445] leading-none mb-1">Ferti+</p>
                    <p className="text-gray-600">Fertilizante natural para melhorar e avivar as cores das suas rosas.</p>
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-green-600 whitespace-nowrap">+ R$ 12,90</p>
                </div>
              </label>

              <label className={`rounded-xl border-2 border-dashed p-4 flex items-start gap-3 cursor-pointer ${kitBonus ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
                <input type="checkbox" checked={kitBonus} onChange={(e) => setKitBonus(e.target.checked)} className="mt-1 w-5 h-5 accent-[#8A3CCF]" />
                <div className="flex-1 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={up2Image}
                      alt="Kit bonus"
                      className="w-16 h-16 rounded-lg border border-gray-200 bg-white object-cover shrink-0"
                    />
                    <div>
                    <p className="text-2xl font-extrabold text-[#0B2445] leading-none mb-1">Kit Bônus 5</p>
                    <p className="text-gray-600">Ganhe 5 vasos decorativos exclusivos para suas rosas.</p>
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-green-600 whitespace-nowrap">+ R$ 29,90</p>
                </div>
              </label>
            </div>
            </div>

            <div className="lg:col-span-4">
            <div className="bg-white text-[#0B2445] rounded-2xl p-5 border border-gray-200 shadow-xl lg:sticky lg:top-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.28em] mb-5 text-center">Revisao final</p>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Kit selecionado</span>
                <span>R$ {basePrice.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Frete</span>
                <span>{effectiveFrete === 'gratis' ? 'Grátis' : (hasCep ? `R$ ${fretePrice.toFixed(2).replace('.', ',')}` : 'A calcular')}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Adicionais</span>
                <span>R$ {((fertiPlus ? 12.9 : 0) + (kitBonus ? 29.9 : 0)).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-2 flex items-center justify-between">
                <p className="text-lg font-bold">Total</p>
                <p className="text-2xl font-black">R$ {total.toFixed(2).replace('.', ',')}</p>
              </div>
            

            <button
              type="button"
              onClick={handleCreatePixCharge}
              disabled={isSubmitting}
              className="w-full py-4 mt-4 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-black text-center uppercase tracking-wide transition block"
            >
              {isSubmitting ? 'Gerando PIX...' : paymentMethod === 'pix' ? 'Gerar pagamento' : 'Confirmar pedido'}
            </button>

            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-center text-sm font-bold text-[#0B2445] mb-3">
                Mais de 1.300 clientes satisfeitos
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                  “Comprei com receio por causa do transporte, mas chegou tudo bem embalado e as mudas vieram fortes. Em 3 semanas já abriu flor.” — <span className="font-semibold">Patricia M., Campinas/SP</span>
                </p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                  “Peguei o kit em dobro para presentear minha mae e valeu muito. O suporte respondeu rapido e explicou certinho o replantio.” — <span className="font-semibold">Renata F., Goiânia/GO</span>
                </p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                  “As cores vieram como no anuncio e o caudex estava bem formado. Achei o custo-beneficio excelente para planta adulta.” — <span className="font-semibold">Juliano R., Curitiba/PR</span>
                </p>
              </div>
            </div>
            </div>
            </div>

            {apiError && (
              <div className="lg:col-span-12 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-semibold">
                {apiError}
              </div>
            )}

            {pedidoConfirmado && (
              <div className="rounded-xl border border-green-200 bg-green-50 text-green-900 p-4 text-sm font-semibold">
                {apiSuccessMessage || 'Cobrança PIX criada com sucesso.'}
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const getCheckoutKitFromUrl = (): CheckoutKit | null => {
    if (window.location.pathname !== '/checkout') return null;
    const kitParam = new URLSearchParams(window.location.search).get('kit');
    return kitParam === 'dobro' ? 'dobro' : 'simples';
  };
  const [checkoutKit, setCheckoutKit] = useState<CheckoutKit | null>(() => getCheckoutKitFromUrl());
  const [cartItems, setCartItems] = useState<CartKitItem[]>(() => {
    try {
      const raw = localStorage.getItem('jardim_cart');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartKitItem[];
      return Array.isArray(parsed) ? parsed.filter((item) => item.kit === 'simples' || item.kit === 'dobro') : [];
    } catch {
      return [];
    }
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const feedbackScrollRef = useRef<HTMLDivElement>(null);
  const [trackingSearch, setTrackingSearch] = useState<string>(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const hasTrackingParams = Array.from(currentParams.keys()).some((key) =>
      /^(utm_|fbclid|gclid|ttclid|msclkid|sck|xcod|src|subid)/i.test(key)
    );

    const saved = sessionStorage.getItem('jardim_tracking_search') ?? '';
    if (hasTrackingParams) {
      const normalized = currentParams.toString();
      sessionStorage.setItem('jardim_tracking_search', normalized);
      return normalized;
    }

    return saved;
  });

  const kitCatalog: Record<CheckoutKit, { title: string; image: string; price: number }> = {
    simples: {
      title: 'Kit Simples - Colecao 5 Cores Raras',
      image: 'https://i.ibb.co/N2Fvzfpn/Oferta-1.png',
      price: 59.9
    },
    dobro: {
      title: 'Kit em Dobro - Colecao 5 Cores Raras',
      image: 'https://i.ibb.co/gLSx40L4/Group-1105.png',
      price: 87.4
    }
  };
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + kitCatalog[item.kit].price * item.quantity, 0);

  useEffect(() => {
    const onPopState = () => {
      setCheckoutKit(getCheckoutKitFromUrl());
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('jardim_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const buildPathWithTracking = (path: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams(trackingSearch);
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => params.set(key, value));
    }
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  const openCheckout = (kit: CheckoutKit) => {
    const nextUrl = buildPathWithTracking('/checkout', { kit });
    window.history.pushState({}, '', nextUrl);
    setCheckoutKit(kit);
    setCurrentPath('/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCheckout = () => {
    window.history.pushState({}, '', buildPathWithTracking('/'));
    setCheckoutKit(null);
    setCurrentPath('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCart = () => {
    window.history.pushState({}, '', buildPathWithTracking('/carrinho'));
    setCheckoutKit(null);
    setCurrentPath('/carrinho');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCart = () => {
    window.history.pushState({}, '', buildPathWithTracking('/'));
    setCurrentPath('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addKitToCartAndOpen = (kit: CheckoutKit) => {
    setCartItems((prev) => {
      const found = prev.find((item) => item.kit === kit);
      if (found) {
        return prev.map((item) => (item.kit === kit ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { kit, quantity: 1 }];
    });
    openCart();
  };

  const updateCartQuantity = (kit: CheckoutKit, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.kit !== kit));
      return;
    }
    setCartItems((prev) => prev.map((item) => (item.kit === kit ? { ...item, quantity: nextQuantity } : item)));
  };

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const hasTrackingParams = Array.from(currentParams.keys()).some((key) =>
      /^(utm_|fbclid|gclid|ttclid|msclkid|sck|xcod|src|subid)/i.test(key)
    );

    if (!hasTrackingParams) return;

    const normalized = currentParams.toString();
    if (normalized && normalized !== trackingSearch) {
      setTrackingSearch(normalized);
      sessionStorage.setItem('jardim_tracking_search', normalized);
    }
  }, [currentPath, checkoutKit, trackingSearch]);

  const gridImages = [
    "https://i.ibb.co/VYfFBdgy/RD-roxa.png",
    "https://i.ibb.co/j9q6Qvzg/RD-branca.png",
    "https://i.ibb.co/qYxR1hTX/RD-vermelha.png",
    "https://i.ibb.co/svm5Rfmm/RD-amarela.png",
    "https://i.ibb.co/VYfFBdgy/RD-roxa.png",
    "https://i.ibb.co/qYxR1hTX/RD-vermelha.png",
    "https://i.ibb.co/QjtMHdr6/RD-negra.png",
    "https://i.ibb.co/qYxR1hTX/RD-vermelha.png",
    "https://i.ibb.co/VYfFBdgy/RD-roxa.png"
  ];

  const testimonials = [
    { name: "Tânia Santos", id: "09VRlGEXfn4" },
    { name: "Eunice Dantas", id: "yiztTOWcqg0" },
    { name: "Aracy", id: "x8V1S5TB4oY" },
    { name: "Paula de Souza", id: "NLNrMCalU80" }
  ];

  const feedbackImages = [
    "https://i.ibb.co/gLFLhkjX/prova-2.jpg",
    "https://i.ibb.co/fzScvLtK/prova-4.png",
    "https://i.ibb.co/pBycQnvp/prova-5.png",
    "https://i.ibb.co/7dJK7Gt6/prova-6.jpg",
    "https://i.ibb.co/cXxrrqGj/prova-7.jpg",
    "https://i.ibb.co/zhkgBQt9/prova-9.jpg",
    "https://i.ibb.co/PZCXKmq6/prova-tal-1.png"
  ];

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (checkoutKit) {
    return <CheckoutModal kit={checkoutKit} onClose={closeCheckout} />;
  }

  if (currentPath === '/carrinho') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-black text-base">JC</div>
              <span className="text-base font-extrabold text-green-800 tracking-tighter">Jardim<span className="text-gray-900">daCida</span></span>
            </div>
            <button onClick={closeCart} className="px-4 h-10 rounded-full bg-white border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-100">
              Voltar
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="px-5 md:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-[#0B2445] uppercase tracking-tight">Seu Carrinho</h2>
              <span className="text-xs font-black text-green-700 uppercase tracking-wider">{totalCartItems} item(ns)</span>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 font-semibold mb-6">Seu carrinho esta vazio.</p>
                <button onClick={closeCart} className="px-6 py-3 rounded-xl bg-green-600 text-white font-black uppercase text-sm tracking-wide hover:bg-green-700">
                  Voltar para ofertas
                </button>
              </div>
            ) : (
              <div className="p-5 md:p-8">
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.kit} className="border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-lg p-2 shrink-0">
                        <img src={kitCatalog[item.kit].image} alt={kitCatalog[item.kit].title} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-green-700 font-black uppercase tracking-wider mb-1">{item.kit === 'dobro' ? 'Kit em Dobro' : 'Kit Simples'}</p>
                        <h3 className="text-sm md:text-base font-black text-[#0B2445]">{kitCatalog[item.kit].title}</h3>
                        <p className="text-sm font-bold text-[#0B2445] mt-1">R$ {kitCatalog[item.kit].price.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQuantity(item.kit, item.quantity - 1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 font-black">-</button>
                        <span className="w-8 text-center font-black">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.kit, item.quantity + 1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 font-black">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <p className="text-2xl font-black text-[#0B2445]">Subtotal: R$ {cartSubtotal.toFixed(2).replace('.', ',')}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCartItems([])}
                      className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-black uppercase text-xs tracking-wide hover:bg-gray-100"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={() => openCheckout(cartItems[0].kit)}
                      className="px-6 py-3 rounded-xl bg-green-600 text-white font-black uppercase text-xs tracking-wide hover:bg-green-700"
                    >
                      Ir para checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage} 
            alt="Feedback ampliado" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Top Banner Offer */}
      <div className="bg-black text-white text-center py-2 px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider">
        OFERTA ESPECIAL POR TEMPO LIMITADO | FRETE GRÁTIS NO KIT EM DOBRO
      </div>

      <Ticker />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-black text-xl">JC</div>
            <span className="text-xl font-extrabold text-green-800 tracking-tighter">Jardim<span className="text-gray-900">daCida</span></span>
          </div>
          
          <div className="hidden lg:flex gap-6 text-sm font-bold uppercase text-gray-600">
            <a href="#caracteristicas" className="hover:text-green-600 transition">Características</a>
            <a href="#como-funciona" className="hover:text-green-600 transition">Como Funciona</a>
            <a href="#avaliacoes" className="hover:text-green-600 transition">Avaliações</a>
            <a href="#faq" className="hover:text-green-600 transition">Perguntas</a>
            <a href="#ofertas" className="hover:text-green-600 transition">Ofertas</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={openCart} className="relative p-2 text-gray-700">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-green-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalCartItems}</span>
            </button>
            <button 
              className="lg:hidden p-2 text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 animate-fadeIn lg:hidden">
          <div className="flex flex-col gap-6 text-2xl font-bold uppercase">
            <a href="#caracteristicas" onClick={() => setIsMenuOpen(false)}>Características</a>
            <a href="#como-funciona" onClick={() => setIsMenuOpen(false)}>Como Funciona</a>
            <a href="#avaliacoes" onClick={() => setIsMenuOpen(false)}>Avaliações</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <a href="#ofertas" onClick={() => setIsMenuOpen(false)} className="text-green-600">Ofertas</a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-green-600 text-white py-12 lg:py-24 overflow-hidden">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 animate-slideUp">
            <div className="flex items-center gap-2 mb-6 bg-green-700/50 w-fit px-4 py-1 rounded-full border border-green-500/30">
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <span className="text-sm font-bold">4.7 | Mais de 1000 avaliações</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
              Tenha um Jardim de Explosão de Cores em Dias: Receba Rosas do Deserto Adultas e Prontas para Florir
            </h1>
            
            <p className="text-lg lg:text-xl text-green-50/90 mb-10 max-w-xl">
              Chega de esperar anos. Nossas matrizes possuem caudex robusto, raízes formadas e genética de cores raras garantida por enxertia.
            </p>

            <a href="#ofertas" className="inline-block w-full sm:w-auto bg-[#F5A623] hover:bg-[#E09612] text-black font-black text-xl py-6 px-12 rounded-lg shadow-xl shadow-black/20 transform active:scale-95 transition-all text-center uppercase tracking-wider">
              QUERO MEU KIT ADULTO
            </a>
            <p className="mt-4 text-xs font-bold text-green-200 text-center sm:text-left uppercase">Kit de Rosas do Deserto Adultas - Coleção 5 Cores Raras</p>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-green-500/30 transform lg:rotate-2">
              <img 
                src="https://i.ibb.co/SwLdD2T5/imagem-hero.png" 
                alt="Rosas do Deserto Jardim da Cida" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tradition Section */}
      <section className="py-20 bg-[#F9F9E0]/60">
        <div className="container mx-auto px-4 text-center">
          <span className="text-green-600 font-bold uppercase tracking-widest text-sm mb-4 block">40 Anos de Tradição</span>
          <h2 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6">40 Anos Cultivando Beleza</h2>
          <p className="text-lg text-gray-600 mb-12">Tradição familiar agora disponível para todo o Brasil</p>
          
          <div className="max-w-4xl mx-auto relative">
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/85xBlUQ-7l0?rel=0&modestbranding=1"
                title="40 Anos Cultivando Beleza"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full text-white border border-white/20">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-tight">Ative o som para conhecer nossa história</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details - Grid Section */}
      <section id="caracteristicas" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* 3x3 Grid of Images on the left */}
            <div className="lg:w-1/2 w-full">
              <div className="grid grid-cols-3 gap-3">
                {gridImages.map((src, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-white/50 bg-white hover:scale-105 transition duration-300">
                    <img 
                      src={src} 
                      alt={`Rosa do Deserto ${i}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Content on the right */}
            <div className="lg:w-1/2 w-full">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                Um mix completo para quem ama rosas de cores raras e exclusivas 
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Diferente das sementes, onde a cor é uma 'loteria', nossas plantas são <strong>Enxertadas</strong>. Você recebe exatamente as cores que comprou, com garantia genética.
              </p>
              
              <ul className="space-y-4">
                {[
                  "5 Rosas do Deserto Adultas (30 a 40cm) prontas para florir",
                  "Cores Garantidas: Amarela, Branca, Vermelha, Roxa e Negra",
                  "Caudex Bem Formado: Base grossa e escultural",
                  "Sanidade Total: Livres de pragas e tratadas com fungicida",
                  "Envio Técnico: Preparadas em Raiz Nua para aguentar a viagem",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 font-bold text-lg leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-[#FDFDF7]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-12 leading-tight">
                Por que escolher o Kit de <span className="text-green-600">Rosas do Deserto Adultas</span> do Jardim da Cida?
              </h2>
              
              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-green-600 mt-1 shrink-0">1.</span>
                  <p className="text-gray-800 text-lg leading-snug">
                    <span className="font-bold">Beleza instantânea:</span> não precisa esperar meses ou anos. Suas rosas do deserto já chegam adultas, com 30-40cm de altura, floridas e prontas para decorar sua casa imediatamente
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-green-600 mt-1 shrink-0">2.</span>
                  <p className="text-gray-800 text-lg leading-snug">
                    <span className="font-bold">Kit 100% completo:</span> plantas + vasos decorativos estilo bacia + substrato premium + fertilizante orgânico + fungicida preventivo. Tudo que você precisa, nada mais para comprar
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    <img src="https://cdn-icons-png.flaticon.com/512/3133/3133160.png" alt="Presente" className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <div className="inline-block bg-[#F5A623] text-white px-4 py-1 rounded-md text-sm font-black uppercase tracking-tight">
                      BÔNUS GRÁTIS
                    </div>
                    <p className="text-gray-800 text-lg leading-snug">
                      <span className="font-bold uppercase">BÔNUS EXCLUSIVO:</span> Manual de Aceleração de Floração com técnicas profissionais para ter flores o ano inteiro, aumentando a frequência de floração em até 3x
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-green-600 mt-1 shrink-0">4.</span>
                  <p className="text-gray-800 text-lg leading-snug">
                    <span className="font-bold">Garantia de saúde certificada:</span> todas as plantas são inspecionadas por especialistas antes do envio e chegam vigorosas, livres de pragas e prontas para prosperar por 10-20 anos
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl font-black text-green-600 mt-1 shrink-0">5.</span>
                  <p className="text-gray-800 text-lg leading-snug">
                    <span className="font-bold">Suporte vitalício:</span> acesso ao grupo VIP de cuidadores via WhatsApp para tirar dúvidas, compartilhar fotos e aprender com especialistas sempre que precisar
                  </p>
                </div>
              </div>
              
              <div className="mt-16 text-center lg:text-left">
                <a href="#ofertas" className="inline-block w-full md:w-auto bg-[#F5A623] hover:bg-[#E09612] text-black font-black text-xl py-5 px-16 rounded-xl shadow-lg transition-transform hover:scale-105 uppercase tracking-wide">
                  QUERO MEU KIT ADULTO
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://i.ibb.co/HpDVQKN4/section-de-benecios-1.png" 
                  alt="Benefícios Jardim da Cida" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="lg:hidden mt-8">
               <img 
                src="https://i.ibb.co/HpDVQKN4/section-de-benecios-1.png" 
                alt="Benefícios Jardim da Cida" 
                className="w-full h-auto object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Manual Section */}
      <section className="py-20 bg-green-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-3/5 text-center lg:text-left">
              <h2 className="text-3xl lg:text-5xl font-black mb-6">Recebeu? Saiba exatamente como plantar.</h2>
              <p className="text-lg text-green-50 mb-8 leading-relaxed">
                Não se preocupe com o transporte. Enviamos junto um <strong>Guia de Re-hidratação</strong>. Ensinamos como 'acordar' sua Rosa do Deserto após a viagem em raiz nua e preparar o vaso ideal.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20">
                  <span className="block text-2xl mb-1">📖</span>
                  <span className="font-bold text-sm">Manual de Germinação</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20">
                  <span className="block text-2xl mb-1">💧</span>
                  <span className="font-bold text-sm">Guia de Re-hidratação</span>
                </div>
              </div>
            </div>
            <div className="lg:w-2/5">
              <div className="bg-white rounded-2xl p-4 shadow-2xl transform lg:rotate-3">
                <img 
                  src="https://i.ibb.co/Ps10Vsk3/manual.jpg" 
                  className="rounded-xl w-full" 
                  alt="Manual de Germinação" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2 relative">
               <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-100 rounded-full -z-10 blur-3xl"></div>
               <img src="https://i.ibb.co/YmnMzkg/foto-floricultura.jpg" className="rounded-[40px] shadow-2xl relative z-10" alt="Floricultura Jardim da Cida" />
               <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl z-20 border border-gray-100 max-w-xs">
                 <p className="text-gray-800 font-bold italic">"Nossa missão é levar o amor pelas rosas para cada canto do Brasil."</p>
                 <span className="block mt-2 text-green-600 font-bold text-sm">— Lúcia Fernandes</span>
               </div>
            </div>
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-bold text-xs uppercase mb-6">
                <Award className="w-4 h-4" /> NOSSA HISTÓRIA
              </div>
              <h2 className="text-3xl lg:text-5xl font-black mb-8">Conheça Mais Sobre Nossa História</h2>
              
              <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                <p>Desde <strong>1985</strong>, o Jardim da Cida é sinônimo de quality e tradição em plantas ornamentais em Ribeirão Preto - SP.</p>
                <p>Fundada por Aparecida Fernanda e hoje comandada por sua filha Lúcia Fernandes, nossa floricultura atravessa gerações mantendo viva a paixão por flores e o compromisso com a excelência.</p>
                <p>Em 2026, expandimos para o digital: agora você pode receber em qualquer lugar do Brasil as mesmas plantas exclusivas que cultivamos com dedicação há quase 40 anos.</p>
                <p>Nossa missão? Levar rosas do deserto de qualidade excepcional e conhecimento especializado para apaixonados por jardinagem em todo o país. Do cultivo ao envio, cada detalhe recebe o cuidado de quem realmente entende de plantas.</p>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <span className="font-bold">40 anos de experiência</span>
                </div>
                <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                  <span className="text-2xl">🌱</span>
                  <span className="font-bold">2 gerações de especialistas</span>
                </div>
                <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <span className="font-bold">Enviamos para todo Brasil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials (Videos) */}
      <section id="avaliacoes" className="py-20 bg-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
             {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
          </div>
          <h2 className="text-3xl lg:text-5xl font-black mb-4">Veja o que nossos clientes estão dizendo</h2>
          <p className="text-green-100 mb-12">Histórias reais de quem já transformou sua casa com o Jardim da Cida</p>
          
          <div className="relative group max-w-6xl mx-auto">
            <button 
              onClick={() => scroll(scrollContainerRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full border border-white/30 hidden md:flex items-center justify-center transition"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={() => scroll(scrollContainerRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full border border-white/30 hidden md:flex items-center justify-center transition"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto snap-x snap-proximity hide-scrollbar gap-6 pb-6 px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {testimonials.map((video, idx) => (
                <div key={idx} className="min-w-[85%] md:min-w-[320px] snap-center text-center">
                  <div className="relative rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl bg-black border-4 border-white/10">
                    <iframe 
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
                      title={video.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="mt-4">
                    <p className="font-black text-lg uppercase tracking-tight">{video.name}</p>
                    <div className="flex justify-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-8 md:hidden">
              <button 
                onClick={() => scroll(scrollContainerRef, 'left')}
                className="bg-white/20 p-4 rounded-full border border-white/30 active:scale-95 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => scroll(scrollContainerRef, 'right')}
                className="bg-white/20 p-4 rounded-full border border-white/30 active:scale-95 transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Feedback (Images) */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-black text-center mb-12 text-gray-900 leading-tight">
            Alguns FeedBacks sobre nosso kit rosas raras do deserto 😍
          </h2>

          <div className="relative group max-w-6xl mx-auto">
            {/* Nav buttons for desktop */}
            <button 
              onClick={() => scroll(feedbackScrollRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 bg-green-600 hover:bg-green-700 p-4 rounded-full text-white shadow-xl hidden md:flex items-center justify-center transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => scroll(feedbackScrollRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 bg-green-600 hover:bg-green-700 p-4 rounded-full text-white shadow-xl hidden md:flex items-center justify-center transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div 
              ref={feedbackScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {feedbackImages.map((src, idx) => (
                <div key={idx} className="min-w-[280px] md:min-w-[350px] snap-center">
                  <div 
                    className="cursor-zoom-in rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 bg-white aspect-auto hover:opacity-90 hover:scale-[1.02] transition-all duration-300"
                    onClick={() => setSelectedImage(src)}
                  >
                    <img 
                      src={src} 
                      alt={`Feedback ${idx + 1}`} 
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Nav buttons */}
            <div className="flex justify-center gap-6 md:hidden mt-4">
              <button 
                onClick={() => scroll(feedbackScrollRef, 'left')}
                className="bg-green-100 p-4 rounded-full text-green-700 border border-green-200 active:scale-90 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => scroll(feedbackScrollRef, 'right')}
                className="bg-green-100 p-4 rounded-full text-green-700 border border-green-200 active:scale-90 transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Offers */}
      <section id="ofertas" className="py-24 bg-[#F9F9E0]/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Oferta 1: Kit Simples */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-extrabold text-green-700 leading-tight">
                  Kit Simples - Coleção<br/><span className="text-green-700">5 Cores Raras</span>
                </h3>
              </div>
              
              <div className="mb-10 rounded-3xl overflow-hidden bg-[#FDFDF7] flex items-center justify-center p-4">
                <img src="https://i.ibb.co/N2Fvzfpn/Oferta-1.png" className="w-full h-auto object-contain" alt="Kit Simples" />
              </div>

              <div className="text-center mb-10">
                <p className="text-gray-500 font-medium mb-1">Tudo isso por apenas</p>
                <p className="text-4xl md:text-5xl font-black text-black">R$ 59,90</p>
              </div>

              <div className="space-y-4 mb-12 flex-grow">
                {[
                  "5 Plantas Adultas Enxertadas",
                  "Cores: Amarela, Branca, Vermelha, Roxa, Negra",
                  "Manual de Re-hidratação e Plantio",
                  "Garantia de Entrega Viva",
                  "Fertilizante, Fungicída e Substrato adequado",
                  "Suporte 7 dias por semana"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium text-sm md:text-base">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addKitToCartAndOpen('simples')}
                className="w-full py-5 rounded-lg border-2 border-black text-black font-extrabold text-lg uppercase tracking-wide hover:bg-black hover:text-white transition duration-300 text-center block"
              >
                GARANTIR MEU KIT
              </button>
            </div>

            {/* Oferta 2: Kit em Dobro */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_15px_50px_rgba(0,0,0,0.1)] border-4 border-green-700 flex flex-col relative">
              <div className="absolute -top-4 right-10 bg-green-600 text-white px-4 py-1 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg">
                Mais Vendido
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-extrabold text-green-700 leading-tight">
                  Kit em Dobro - Coleção<br/><span className="text-green-700">5 Cores Raras</span>
                </h3>
              </div>
              
              <div className="mb-6 rounded-3xl overflow-hidden bg-[#FDFDF7] flex items-center justify-center p-4 relative">
                <img src="https://i.ibb.co/gLSx40L4/Group-1105.png" className="w-full h-auto object-contain" alt="Kit em Dobro" />
              </div>

              <div className="text-center mb-10">
                <p className="text-gray-500 font-medium mb-1">Tudo isso por apenas</p>
                <p className="text-4xl md:text-5xl font-black text-black">R$ 87,40</p>
              </div>

              <div className="space-y-4 mb-12 flex-grow">
                {[
                  "10 Plantas Adultas Enxertadas",
                  "Cores: Amarela, Branca, Vermelha, Roxa, Negra",
                  "Manual de Re-hidratação e Plantio",
                  "Garantia de Entrega Viva",
                  "Frete Grátis para todo Brasil"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 font-medium text-sm md:text-base">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addKitToCartAndOpen('dobro')}
                className="w-full py-5 rounded-lg bg-green-600 text-white font-extrabold text-lg uppercase tracking-wide hover:bg-green-700 shadow-xl shadow-green-600/20 transition duration-300 text-center block"
              >
                GARANTIR MEU KIT EM DOBRO
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-[#FDFDF7]">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">Perguntas frequentes</h2>
          <div className="flex flex-col">
            <FAQAccordion 
              question="As plantas do Kit já vêm com flores?" 
              answer="Nossas Rosas do Deserto são adultas (30-40cm) e prontas para florir. Elas podem chegar com botões ou prontas para iniciar o ciclo de floração em poucas semanas após o plantio em sua nova casa. Como o envio é em raiz nua, enviamos sem as flores abertas para evitar que se percam no transporte, garantindo que a planta chegue com energy máxima para florir no seu jardim." 
            />
            <FAQAccordion 
              question="Se as plantas chegarem danificadas, tenho garantia?" 
              answer="Sim! Temos Garantia de Entrega Viva. Se por algum motivo as plantas sofrerem danos irreversíveis durante o transporte, basta entrar em contato com nosso suporte com fotos/vídeos em até 24h após o recebimento que faremos o reenvio sem custos para você." 
            />
            <FAQAccordion 
              question="O que é o Jardim da Cida?" 
              answer="O Jardim da Cida é uma floricultura familiar tradicional com quase 40 anos de história, localizada em Ribeirão Preto - SP. Somos especialistas em Rosas do Deserto e expandimos nossa paixão para todo o Brasil através da nossa loja online, mantendo o padrão de qualidade artesanal e cuidado técnico." 
            />
            <FAQAccordion 
              question="O frete é grátis para todo o Brasil?" 
              answer="O frete é gratuito para o 'Kit em Dobro' para todo o território nacional. Para o 'Kit simples', o frete é calculado de acordo com sua região, mas sempre buscamos as melhores tarifas com nossas transportadoras parceiras." 
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] text-white pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-black text-xl">JC</div>
                <span className="text-2xl font-black tracking-tighter">Jardim da Cida</span>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed mb-8">
                Rosas do Deserto adultas enxertadas, prontas para florir. Caudex formado, cores garantidas e sanidade total. Transforme sua casa com plantas exóticas de alta qualidade.
              </p>
              
              <div className="space-y-4">
                <h4 className="font-black uppercase text-sm tracking-widest text-green-500">Atendimento ao Cliente</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">E-mail</p>
                    <p className="font-bold">info@jardimdacida.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Clock className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Chat ao vivo das 9:00 às 18:00</p>
                    <p className="font-bold text-sm text-gray-300">Segunda a Sexta (Horário de Brasília GMT-3)</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-6">Informação</h4>
              <ul className="space-y-3 text-gray-400 font-medium">
                <li><a href="#" className="hover:text-green-500 transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-green-500 transition">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-green-500 transition">Trocas e Devoluções</a></li>
                <li><a href="#" className="hover:text-green-500 transition">Envio e Entrega</a></li>
                <li><a href="#" className="hover:text-green-500 transition">Devolução e Reembolso</a></li>
                <li><a href="#" className="hover:text-green-500 transition">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase text-sm tracking-widest mb-6 text-center lg:text-left">Formas de Pagamento</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'PIX', logo: 'https://i.ibb.co/bMrvrWWG/pix.png' },
                  { name: 'Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1000px-Mastercard-logo.svg.png' },
                  { name: 'Discover', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Discover_Card_logo.svg/1000px-Discover_Card_logo.svg.png' },
                  { name: 'Amex', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/1024px-American_Express_logo.svg.png' }
                ].map((p) => (
                  <div key={p.name} className="bg-white p-1 rounded flex items-center justify-center h-10 shadow-sm border border-white/10 group overflow-hidden">
                    <img src={p.logo} alt={p.name} className="h-6 w-auto object-contain transition-transform group-hover:scale-110" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm font-bold">
              © 2025 Jardim da Cida | Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
