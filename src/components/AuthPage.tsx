/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { USER_ROLES } from '../mockData';
import { ShieldCheck, UserCheck, AlertTriangle, ArrowRight, Smartphone, Eye, EyeOff, Mail, CheckCircle2, Lock, Shield, Loader2 } from 'lucide-react';
import { signInWithGoogle, saveUserDocument } from '../lib/firebase';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'EXPORTACAO' | 'LOGIN' | 'ALTERACAO_SENHA', descricao: string) => void;
}

export function AuthPage({ onLoginSuccess, addLog }: AuthPageProps) {
  const [selectedUser, setSelectedUser] = useState<User>(USER_ROLES[0]);
  const [email, setEmail] = useState('carlos@meisimple.com.br');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorInput, setErrorInput] = useState('');
  
  // 2FA state
  const [is2FAPending, setIs2FAPending] = useState(false);
  const [isNumericKeyboard, setIsNumericKeyboard] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [consentLGPD, setConsentLGPD] = useState(true);

  // New states for the custom 2FA behaviors requested
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [validCode, setValidCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [hasBlocked2FA, setHasBlocked2FA] = useState(false);
  
  // Identity validation & recovery states
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryUserCodeInput, setRecoveryUserCodeInput] = useState('');
  const [recoverySentCode, setRecoverySentCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showRecPassword, setShowRecPassword] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput('');

    if (!consentLGPD) {
      setErrorInput('Você deve aceitar os termos de consentimento da LGPD para acessar o sistema.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorInput('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 4) {
      setErrorInput('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    // Match existing or create dynamic valid profile
    const existing = USER_ROLES.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    const userToLogin: User = existing || {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email: email.trim().toLowerCase(),
      role: 'admin',
      permissions: {
        dashboard: true,
        cadastros: true,
        estoque: true,
        financeiro: true,
        notas: true,
        relatorios: true,
        configuracoes: true
      },
      document: '30.751.934/0001-30',
      cargo: 'Titular / Administrador MEI',
      dataAdmissao: new Date().toISOString().split('T')[0],
      status: 'ativo'
    };

    setSelectedUser(userToLogin);
    setIs2FAPending(true);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
    if (val.length <= 6) {
      setOtpCode(val);
      setErrorInput('');
      
      if (val.length === 6) {
        triggerAutoVerification(val);
      }
    }
  };

  const triggerAutoVerification = (codeToVerify: string) => {
    setErrorInput('');
    // For convenience of testing, allow either the dynamically generated code OR standard '123456'
    const isCorrect = codeToVerify === validCode || codeToVerify === '123456';
    
    if (isCorrect) {
      completeSuccessfulLogin();
    } else {
      const nextRemaining = attemptsRemaining - 1;
      setAttemptsRemaining(nextRemaining);
      setOtpCode('');
      
      if (nextRemaining > 0) {
        setErrorInput('Código de verificação incorreto! Você possui apenas mais 1 tentativa de acesso.');
        setIs2FAPending(false); // Retorna de imediato para a tela de autenticação
      } else {
        setHasBlocked2FA(true);
        setErrorInput('Duas tentativas incorretas! O acesso foi bloqueado por segurança. Valide sua identidade para atualizar suas informações de segurança.');
      }
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSocialLogin = async (provider: 'Google' | 'Facebook' | 'Apple') => {
    if (provider === 'Google') {
      setErrorInput('');
      setIsGoogleLoading(true);
      try {
        const fbUser = await signInWithGoogle();
        if (!fbUser) {
          setIsGoogleLoading(false);
          setErrorInput('A janela de login do Google foi fechada antes da confirmação. Clique novamente para entrar.');
          return;
        }

        const authenticatedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Empreendedor MEI',
          email: fbUser.email || 'usuario@meisimple.com.br',
          role: 'admin',
          permissions: {
            dashboard: true,
            cadastros: true,
            estoque: true,
            financeiro: true,
            notas: true,
            relatorios: true,
            configuracoes: true
          },
          document: '30.751.934/0001-30',
          cargo: 'Titular / Administrador MEI',
          dataAdmissao: new Date().toISOString().split('T')[0],
          status: 'ativo',
          foto: fbUser.photoURL || undefined
        };

        // Persist profile in Firestore
        await saveUserDocument('users', fbUser.uid, authenticatedUser).catch(e => {
          console.warn('Erro ao salvar perfil no Firestore:', e);
        });

        addLog(
          'Autenticação', 
          'LOGIN', 
          `Login seguro realizado via Google Sign-In (Firebase Auth) por ${authenticatedUser.name} (${authenticatedUser.email})`
        );
        onLoginSuccess(authenticatedUser);
      } catch (err: any) {
        console.error('Falha no login Google Firebase:', err);
        if (err?.code === 'auth/popup-closed-by-user') {
          setErrorInput('A janela de login do Google foi fechada antes da confirmação.');
        } else if (err?.code === 'auth/popup-blocked') {
          setErrorInput('O pop-up de login foi bloqueado pelo navegador. Por favor, permita pop-ups nesta página.');
        } else {
          setErrorInput(err?.message || 'Falha ao autenticar com o Google via Firebase.');
        }
      } finally {
        setIsGoogleLoading(false);
      }
      return;
    }

    addLog('Autenticação', 'LOGIN', `Login realizado via conta ${provider} por ${selectedUser.name} (${selectedUser.role.toUpperCase()})`);
    onLoginSuccess(selectedUser);
  };

  const handleSendRecoveryCode = () => {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setRecoverySentCode(generatedCode);
    setIsCodeSent(true);
    setErrorInput('');
    addLog('Autenticação', 'ALTERACAO_SENHA', `Código de redefinição de 2FA solicitado por ${selectedUser.name}. Código temporário: ${generatedCode}`);
  };

  const handleSubmitRecoveryValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput('');

    // Check password simulation (accept either standard '123456' or whatever was input if length is valid)
    if (recoveryPassword !== '123456' && recoveryPassword.length < 6) {
      setErrorInput('Senha incorreta! Use o padrão (123456) do perfil ou digite uma senha válida.');
      return;
    }

    // Check confirmation code
    if (!recoveryUserCodeInput) {
      setErrorInput('Insira o código de validação recebido.');
      return;
    }

    if (recoveryUserCodeInput !== recoverySentCode) {
      setErrorInput('Código de validação incorreto. Use o código temporário fornecido na página.');
      return;
    }

    // Success! Update information, reset counters and log in.
    setAttemptsRemaining(2);
    setHasBlocked2FA(false);
    setIs2FAPending(false);
    
    // Generate a fresh new valid code for subsequent logins
    const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
    setValidCode(freshCode);
    setRecoveryPassword('');
    setRecoveryUserCodeInput('');
    setIsCodeSent(false);
    setRecoverySentCode('');
    
    addLog('Autenticação', 'ALTERACAO_SENHA', `Atualização de 2FA e validação de identidade realizada com sucesso por ${selectedUser.name}`);
    completeSuccessfulLogin();
  };

  const verify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutoVerification(otpCode);
  };

  const completeSuccessfulLogin = () => {
    addLog('Autenticação', 'LOGIN', `Login realizado com sucesso por ${selectedUser.name} (${selectedUser.role.toUpperCase()})`);
    onLoginSuccess(selectedUser);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white select-none">
      {/* Top Header Section with Dark Background */}
      <div className="bg-[#263238] pt-12 pb-14 px-4 sm:px-6 lg:px-8 flex flex-col items-center shrink-0">
        <div className="flex justify-center">
          <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white">
          MEI<span className="text-emerald-400">-Simple</span>
        </h2>
        <p className="mt-1 text-center text-sm text-slate-300 font-medium">
          Gestão fiscal, caixa e estoque simplificados para o Microempreendedor
        </p>
      </div>

      {/* Bottom Section with 100% Pure White Background and Legal Phrase */}
      <div className="bg-white flex-1 w-full flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        <div className="w-full max-w-md bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">

          {!is2FAPending ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  E-mail de Acesso
                </label>
                <div className="mt-1 flex rounded-md">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorInput('');
                    }}
                    placeholder="seu.email@empresa.com.br"
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Senha de Acesso
                  </label>
                </div>
                <div className="mt-1 relative rounded-md">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                    placeholder="Digite sua senha..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Esconder Senha' : 'Mostrar Senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* LGPD Safety Notice */}
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="lgpd"
                    name="lgpd"
                    type="checkbox"
                    checked={consentLGPD}
                    onChange={(e) => setConsentLGPD(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="ml-2.5 text-xs">
                  <label htmlFor="lgpd" className="font-bold text-slate-900 select-none cursor-pointer">
                    Declaro consentimento nos termos da LGPD
                  </label>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Autorizo o processamento de dados para faturamento, emissão e apurações do MEI.
                  </p>
                </div>
              </div>

              {errorInput && (
                <div className="text-xs text-rose-700 flex gap-1.5 items-center bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorInput}</span>
                </div>
              )}

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  className="w-full h-11 flex justify-center items-center px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  Continuar com Segurança <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>

              {/* Social Login Buttons Section */}
              <div className="relative my-5 select-none">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
                  <span className="bg-white px-3 text-slate-500">
                    Ou acesse por outras contas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 select-none">
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Entrar com sua conta Google via Firebase Auth"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-emerald-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  {isGoogleLoading ? 'Autenticando...' : 'Google'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Facebook')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </form>
          ) : (
            // 2FA TOTP or Security Identity Recovery Form
            hasBlocked2FA ? (
              // Blocked 2FA Recovery Instructions and Identity Validation Form
              <form onSubmit={handleSubmitRecoveryValidation} className="space-y-5">
                <div className="text-center select-none">
                  <div className="mx-auto w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-200">
                    <Shield className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    Identidade Bloqueada
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Você excedeu o número de tentativas permitidas do 2FA. Para restabelecer suas informações de acesso com segurança, complete a validação abaixo.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-1" />

                {/* Password Validation Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Sua Senha de Acesso
                  </label>
                  <div className="relative rounded-md">
                    <input
                      type={showRecPassword ? 'text' : 'password'}
                      value={recoveryPassword}
                      onChange={(e) => setRecoveryPassword(e.target.value)}
                      required
                      placeholder="Digite sua senha de acesso"
                      className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-4 py-2.5 text-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecPassword(!showRecPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      {showRecPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Request Code Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 select-none">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900">Código de Validação</p>
                        <p className="text-[10px] text-slate-600 truncate max-w-[180px]">
                          Para {selectedUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendRecoveryCode}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer select-none"
                    >
                      {isCodeSent ? 'Reenviar Código' : 'Enviar Código'}
                    </button>
                  </div>

                  {isCodeSent && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="flex gap-2 items-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-900">Mensagem Enviada!</p>
                          <p className="text-[10px] text-emerald-800 mt-0.5">
                            Para a simulação de identidade, digite o código gerado no campo abaixo:
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-300 tracking-wider text-sm select-all">
                              {recoverySentCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recovery Code Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 text-center mb-1">
                    Código de Segurança de 6 dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={recoveryUserCodeInput}
                    onChange={(e) => setRecoveryUserCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="∙∙∙∙∙∙"
                    className="block w-52 mx-auto text-center rounded-xl border border-slate-300 bg-white text-slate-900 font-mono tracking-[0.5em] text-xl py-2 px-4 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition"
                  />
                </div>

                {errorInput && (
                  <div className="text-xs text-rose-700 flex gap-1.5 items-center bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorInput}</span>
                  </div>
                )}

                {/* Submit Recovery */}
                <div className="flex flex-col gap-2 pt-2 select-none">
                  <button
                    type="submit"
                    className="w-full flex h-11 items-center justify-center rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                  >
                    Validar Identidade e Acessar Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasBlocked2FA(false);
                      setAttemptsRemaining(2);
                      setErrorInput('');
                      setIs2FAPending(false);
                      setOtpCode('');
                      setIsCodeSent(false);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline text-center cursor-pointer py-1"
                  >
                    Voltar para o Login Principal
                  </button>
                </div>
              </form>
            ) : (
              // Standard 2FA Screen
              <form onSubmit={verify2FA} className="space-y-5">
                <div className="text-center">
                  <Smartphone className="w-12 h-12 text-emerald-600 mx-auto animate-pulse" />
                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {recoveryMode ? 'Chave de Recuperação' : 'Autenticação em Duas Etapas (2FA)'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                    {recoveryMode
                      ? 'Insira a contra-chave gerada no primeiro acesso para contornar o autenticador.'
                      : `Digite o código dinâmico gerado pelo seu aplicativo autenticador vinculado a ${selectedUser.name}`
                    }
                  </p>
                </div>

                {/* QR Code demo display */}
                {!recoveryMode && (
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex flex-col items-center">
                    <div className="w-24 h-24 bg-white border border-slate-300 flex items-center justify-center relative p-1.5 rounded-xl">
                      <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-80 select-none pointer-events-none">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-full h-full ${
                              (i * i * 3) % 5 === 0 || (i * 7) % 3 === 0 ? 'bg-slate-900' : 'bg-white'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-2">
                      ID Segurança: 2FA-MEI-SECURE-KEY
                    </span>
                  </div>
                )}

                {/* Verification input */}
                {!recoveryMode ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 text-center mb-1">
                      Código de Segurança de 6 dígitos
                    </label>

                    {/* Keyboard switcher for mobile: 123 numeric vs ABC alphanumeric */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setIsNumericKeyboard(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isNumericKeyboard 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        123 Numérico
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsNumericKeyboard(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          !isNumericKeyboard 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ABC Letras
                      </button>
                    </div>

                    <input
                      type="text"
                      inputMode={isNumericKeyboard ? "numeric" : "text"}
                      autoCapitalize="characters"
                      pattern={isNumericKeyboard ? "[0-9]*" : "[a-zA-Z0-9]*"}
                      maxLength={6}
                      value={otpCode}
                      onChange={handleOtpChange}
                      placeholder="∙∙∙∙∙∙"
                      className="block w-56 mx-auto text-center rounded-xl border border-slate-300 bg-white text-slate-900 font-mono tracking-[0.5em] text-2xl py-2.5 px-4 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none transition"
                    />
                    
                    <div className="text-center pt-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-emerald-200 select-none">
                        <Lock className="w-3.5 h-3.5" />
                        Código para Teste: <strong className="font-mono text-xs tracking-widest text-emerald-900">{validCode}</strong>
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 select-none leading-relaxed">
                        Digite os 6 caracteres acima. A validação é executada automaticamente.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Chave de Recuperação
                    </label>
                    <input
                      type="text"
                      value={recoveryKey}
                      onChange={(e) => setRecoveryKey(e.target.value)}
                      placeholder="MEI-REC-XXXX"
                      className="block w-full text-center rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm px-3 py-2.5 uppercase focus:border-emerald-600 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 block text-center mt-1">
                      Dica de teste: Digite <strong>MEI-REC-2026</strong>
                    </span>
                  </div>
                )}

                {errorInput && (
                  <div className="text-xs text-rose-700 flex gap-1.5 items-center bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorInput}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMode(!recoveryMode);
                      setErrorInput('');
                    }}
                    className="text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
                  >
                    {recoveryMode ? 'Voltar para o código QR' : 'Chave de Recuperação'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIs2FAPending(false);
                      setErrorInput('');
                      setOtpCode('');
                    }}
                    className="text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
                  >
                    Voltar para Senha
                  </button>
                </div>
              </form>
            )
          )}
        </div>

        {/* Legal Disclaimer inside pure white space */}
        <div className="mt-6 text-center text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Ambiente em conformidade com o Comitê Gestor do Simples Nacional (CGSN) e as regras da LGPD (Lei 13.709/18).
        </div>
      </div>
    </div>
  );
}
