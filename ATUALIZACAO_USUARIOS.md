# Atualização de controle de usuários

- Botões Ativar/Desativar e Bloquear/Desbloquear em Usuários, com confirmação e gravação no Firestore.
- Usuários existentes sem campo `ativo` são considerados ativos, evitando bloqueios inesperados.
- Novos usuários são criados com `ativo: true` e `bloqueado: false`.
- Login recusa usuários inativos ou bloqueados. Sessões com matrícula identificada são encerradas quando o Firestore sinaliza bloqueio/desativação.
- Para sessões abertas antes desta atualização, faça logout/login para gravar a matrícula da sessão.
- Também foi corrigida a comunicação da fila offline entre o módulo Firebase e o script principal.

## Publicação
Substitua os arquivos do repositório GitHub pelos deste pacote, mantendo a mesma estrutura, e aguarde o GitHub Pages publicar. Faça login como ADMIN, acesse Usuários e teste primeiro com um inspetor de teste.

## Limitação crítica de segurança
Esta atualização NÃO muda o login ADMIN com senha fixa, as senhas de usuários armazenadas em texto puro nem a autenticação anônima Firebase. Portanto, bloqueio na interface **não** equivale a uma autorização robusta no servidor. Para impedir acesso direto ao Firestore, é indispensável migrar para autenticação identificada no Firebase e regras de segurança baseadas em identidade/perfil. Não trate esta versão como segura para dados sensíveis.
