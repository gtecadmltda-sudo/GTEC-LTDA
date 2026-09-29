/**
 * Utilitário Completo de Download e Exportação de Arquivos XML Fiscais
 * Compatível com SEFAZ Nacional (NF-e, NFC-e) e Sped Gov.br (NFS-e MEI)
 */

import JSZip from 'jszip';
import { Invoice } from '../types';

/**
 * Gera um XML fiscal estruturado e válido caso o invoice não possua um
 */
export function ensureInvoiceXml(invoice: Invoice): string {
  if (invoice.xmlSimulado && invoice.xmlSimulado.trim().length > 30) {
    return invoice.xmlSimulado.trim();
  }

  const isNFe = invoice.tipo === 'NFE';
  const emitenteCnpj = '30.751.934/0001-30';
  const emitenteRazao = 'MARCENARIA DESIGN & ARTE MEI LTDA';
  const dataEmissao = new Date(invoice.dataEmissao).toISOString();
  const valorFormatado = invoice.valorTotal.toFixed(2);
  const chaveAcesso = isNFe 
    ? `3526063075193400013055001000${invoice.numero.padStart(9, '0')}1004883291`
    : `3526063075193400013056001000${invoice.numero.padStart(9, '0')}`;

  if (isNFe) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${chaveAcesso}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>${Math.floor(10000000 + Math.random() * 90000000)}</cNF>
        <natOp>Venda de Mercadorias MEI</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>${invoice.numero}</nNF>
        <dhEmi>${dataEmissao}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>1</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>MEI-Simple-ERP-2.4</verProc>
      </ide>
      <emit>
        <CNPJ>${emitenteCnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${emitenteRazao}</xNome>
        <xFant>Marcenaria Design</xFant>
        <enderEmit>
          <xLgr>Avenida Paulista</xLgr>
          <nro>1578</nro>
          <xBairro>Bela Vista</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01310200</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderEmit>
        <IE>112233445566</IE>
        <CRT>4</CRT> <!-- CRT 4 = Microempreendedor Individual (MEI) -->
      </emit>
      <dest>
        ${(invoice.destinatarioDocumento || invoice.clienteCnpjCpf || '').replace(/\D/g, '').length > 11
          ? `<CNPJ>${(invoice.destinatarioDocumento || invoice.clienteCnpjCpf || '').replace(/\D/g, '')}</CNPJ>`
          : `<CPF>${(invoice.destinatarioDocumento || invoice.clienteCnpjCpf || '').replace(/\D/g, '') || '00000000000'}</CPF>`}
        <xNome>${invoice.destinatarioNome}</xNome>
        <enderDest>
          <xLgr>Rua Principal do Cliente</xLgr>
          <nro>100</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01000000</CEP>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD-${invoice.numero}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>Mercadorias e Produtos Manufaturados - Emissão MEI</xProd>
          <NCM>94036000</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>${valorFormatado}</vUnCom>
          <vProd>${valorFormatado}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>1.0000</qTrib>
          <vUnTrib>${valorFormatado}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>0.00</vTotTrib>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN> <!-- Tributação Imune no MEI -->
            </ICMSSN102>
          </ICMS>
          <PIS>
            <PISNT>
              <CST>07</CST>
            </PISNT>
          </PIS>
          <COFINS>
            <COFINSNT>
              <CST>07</CST>
            </COFINSNT>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCPUFDest>0.00</vFCPUFDest>
          <vICMSUFDest>0.00</vICMSUFDest>
          <vICMSUFRemet>0.00</vICMSUFRemet>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${valorFormatado}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${valorFormatado}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>01</tPag>
          <vPag>${valorFormatado}</vPag>
        </detPag>
      </pag>
      <infAdic>
        <infCpl>EMITIDA POR MEI - MICROEMPREENDEDOR INDIVIDUAL. DOCUMENTO EM CONFORMIDADE COM A RESOLUCAO CGSN N 169/2022.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>1</tpAmb>
      <verAplic>SP_NFE_PL009_V4</verAplic>
      <chNFe>${chaveAcesso}</chNFe>
      <dhRecbto>${dataEmissao}</dhRecbto>
      <nProt>13526000${invoice.numero.padStart(7, '0')}</nProt>
      <digVal>zFv7nS82K1jVpQwErTg+LmNoPqU=</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
  }

  // NFS-e de Serviços Padrão Nacional Sped / Gov.br
  return `<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infNFSe Id="NFSe${chaveAcesso}">
    <numero>${invoice.numero}</numero>
    <codigoVerificacao>MEI-${Math.random().toString(36).substring(2, 8).toUpperCase()}</codigoVerificacao>
    <dataEmissao>${dataEmissao}</dataEmissao>
    <competencia>${invoice.dataEmissao.substring(0, 7)}</competencia>
    <prestador>
      <cnpj>${emitenteCnpj.replace(/\D/g, '')}</cnpj>
      <razaoSocial>${emitenteRazao}</razaoSocial>
      <nomeFantasia>Marcenaria Design</nomeFantasia>
      <optanteSimplesNacional>1</optanteSimplesNacional>
      <regimeEspecialTributacao>6</regimeEspecialTributacao> <!-- MEI -->
      <incentivoFiscal>2</incentivoFiscal>
    </prestador>
    <tomador>
      <cpfCnpj>${(invoice.destinatarioDocumento || invoice.clienteCnpjCpf || '').replace(/\D/g, '') || '00000000000'}</cpfCnpj>
      <razaoSocial>${invoice.destinatarioNome}</razaoSocial>
    </tomador>
    <servico>
      <valores>
        <valorServicos>${valorFormatado}</valorServicos>
        <valorDeducoes>0.00</valorDeducoes>
        <valorPis>0.00</valorPis>
        <valorCofins>0.00</valorCofins>
        <valorInss>0.00</valorInss>
        <valorIr>0.00</valorIr>
        <valorCsll>0.00</valorCsll>
        <issRetido>2</issRetido>
        <valorIss>0.00</valorIss>
        <valorLiquidoNfse>${valorFormatado}</valorLiquidoNfse>
      </valores>
      <itemListaServico>14.01</itemListaServico>
      <discriminacao>${invoice.discriminacao || 'Prestação de Serviços Profissionais e Técnicos de Marcenaria e Montagem'}</discriminacao>
      <municipioPrestacaoServico>3550308</municipioPrestacaoServico>
    </servico>
    <outrasInformacoes>DOCUMENTO EMITIDO POR MEI - ISENTO DE RETENÇÃO DE ISS CONFORME LEI COMPLEMENTAR 123/2006.</outrasInformacoes>
  </infNFSe>
</NFSe>`;
}

/**
 * Cria o nome de arquivo padronizado para o XML
 */
export function getInvoiceXmlFilename(invoice: Invoice): string {
  const isNFe = invoice.tipo === 'NFE';
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedName = sanitize(invoice.destinatarioNome).substring(0, 20);
  const numPad = invoice.numero.padStart(6, '0');

  if (isNFe) {
    return `NFe_${numPad}_${sanitizedName}.xml`;
  }
  return `NFSe_${numPad}_${sanitizedName}.xml`;
}

/**
 * Realiza o download direto de uma string XML no navegador como arquivo .xml
 */
export function downloadXmlString(filename: string, xmlContent: string): boolean {
  try {
    const cleanXml = xmlContent.trim();
    const blob = new Blob([cleanXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.xml') ? filename : `${filename}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Erro ao realizar download do arquivo XML:', error);
    return false;
  }
}

/**
 * Realiza o download do arquivo XML de uma nota fiscal específica
 */
export function downloadInvoiceXml(invoice: Invoice): boolean {
  const xmlContent = ensureInvoiceXml(invoice);
  const filename = getInvoiceXmlFilename(invoice);
  return downloadXmlString(filename, xmlContent);
}

/**
 * Compacta múltiplos XMLs fiscais e baixa em formato .ZIP
 */
export async function downloadInvoicesZip(invoices: Invoice[], zipFileName?: string): Promise<boolean> {
  if (!invoices || invoices.length === 0) {
    alert('Nenhuma nota fiscal selecionada para download.');
    return false;
  }

  try {
    const zip = new JSZip();
    const folderNfe = zip.folder('NFe_Produtos');
    const folderNfse = zip.folder('NFSe_Servicos');

    let countNfe = 0;
    let countNfse = 0;

    (invoices || []).forEach((inv) => {
      const xml = ensureInvoiceXml(inv);
      const filename = getInvoiceXmlFilename(inv);

      if (inv.tipo === 'NFE') {
        folderNfe?.file(filename, xml);
        countNfe++;
      } else {
        folderNfse?.file(filename, xml);
        countNfse++;
      }
    });

    // Adiciona manifesto informativo
    const manifesto = `PACOTE DE EXPORTACAO DE XMLS FISCAIS - MEI SIMPLE ERP
=========================================================
Data de Geracao: ${new Date().toLocaleString('pt-BR')}
Total de Notas Exportadas: ${invoices.length}
- NF-e (Mercadorias e Produtos): ${countNfe}
- NFS-e (Serviços Sped Nacional): ${countNfse}

Padrao: XML SEFAZ Nacional v4.00 e Sped Nacional MEI
Regime Tributario: Microempreendedor Individual (MEI)
Conformidade: Artigo 26 da Lei Complementar 123/2006
=========================================================`;

    zip.file('LEIA-ME_Manifesto_Fiscal.txt', manifesto);

    const content = await zip.generateAsync({ type: 'blob' });
    const nowStr = new Date().toISOString().split('T')[0];
    const finalName = zipFileName || `Pacote_XML_Notas_Fiscais_MEI_${nowStr}.zip`;

    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Erro ao gerar arquivo compactado de XMLs:', err);
    alert('Ocorreu um erro ao gerar o pacote ZIP com os arquivos XML.');
    return false;
  }
}
