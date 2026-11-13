# InspeçãoFire — versão modularizada

Esta versão separa o HTML original em arquivos sem alterar intencionalmente as rotinas, credenciais, permissões ou a configuração do Firebase.

## Estrutura
- `index.html`: interface e bibliotecas externas
- `css/styles.css`: estilos próprios extraídos do HTML
- `js/app.js`: lógica operacional original (script clássico)
- `js/firebase-service.js`: integração original com Firebase (módulo ES)

## Publicação no Netlify
Envie a pasta `inspecaofire` como raiz do site ou publique o conteúdo dela, mantendo as subpastas `css` e `js`. Para testar localmente, utilize um servidor HTTP (por exemplo, `python -m http.server 8000` dentro da pasta) e acesse `http://localhost:8000`. A autenticação e as permissões do Firebase precisam estar configuradas para o domínio utilizado.

## Atenção: segurança
Esta é uma **modularização estrutural**, não uma correção de segurança. O código original contém senha administrativa fixa, senhas de usuários comparadas no navegador e autenticação anônima no Firebase. Não utilize com dados sensíveis antes de corrigir esses pontos e verificar as regras do Firestore.

## Testes recomendados
Confirme login, listagem, cadastro, inspeção, geração/conclusão de O.S., QR Code, mapas, relatórios e sincronização em um ambiente de testes. A extração foi verificada estruturalmente, mas não houve execução de testes de interface ou conexão real ao Firebase.

## Atualização: etapas 3 e 4
- Checklist: validação de todas as respostas antes da inspeção.
- Fotos: erros de leitura/decodificação são informados; limite de 3 imagens e 12 MB por arquivo na inspeção.
- Inspeções: identificadores únicos; O.S. gerada com referência à inspeção.
- Sincronização: fila com trava contra execuções simultâneas e estado pendente explícito.
- Backup: restauração valida arrays e identificadores; restauração **não exclui** dados ausentes do arquivo.

### Limitações importantes
- Autenticação, permissões e regras do Firebase NÃO foram corrigidas nesta etapa.
- Operação offline depende do armazenamento local do navegador, sujeito a limpeza e limites de espaço.
- Fotos ainda são armazenadas em Base64 nos documentos; migrar para Firebase Storage em etapa posterior.
- A gravação de inspeção e O.S. não é transação atômica; deve ser migrada para batch/transação após revisão das regras.
- A execução em navegador e as permissões reais do Firebase precisam de testes antes de produção.

## Correções adicionais (13/11/2026)
- Checklist inicia sem resposta, aceita Sim/Não/N/A e exige resposta explícita.
- Cadastro aguarda retorno da gravação e diferencia confirmação na nuvem de pendência offline.
- Inspeção reprovada e respectiva O.S. são gravadas em um único lote atômico do Firestore; a fila offline preserva o conjunto.
- Falhas de permissão não são confundidas com falhas temporárias de rede.
- Backup inclui usuários (atenção: no modelo atual também inclui senhas; proteja o arquivo), versão do esquema e validação básica na restauração.
- Restauração informa falhas parciais, sem excluir automaticamente dados ausentes.
- Escape HTML em campos importantes de tabelas. É necessária auditoria adicional de todas as inserções HTML dinâmicas.

**Exceções solicitadas:** login administrativo com senha fixa e senhas em texto simples no Firestore não foram modificados. Ambos continuam sendo riscos graves. Não use com dados sensíveis em produção.

**Limitações:** a fila ainda usa localStorage (capacidade limitada); fotos permanecem em Base64. A implementação não foi validada com Firebase real. Recomenda-se teste em ambiente de homologação e cópia de segurança antes de publicar.
