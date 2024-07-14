# Projeto de Mapeamento das Obras de Machado de Assis

[![Hugging Face](https://img.shields.io/badge/🤗%20Hugging%20Face-100000?style=for-the-badge&logo=huggingface&logoColor=white)](https://huggingface.co/spaces/histlearn/MachadodeAssis)

Este projeto desenvolve uma aplicação web semântica que mapeia localidades geográficas nas obras de Machado de Assis. Integrando dados da enciclopédia MachadodeAssis.net com coordenadas de Geonames.org e GoogleMaps, oferece mapas interativos para as menções aos espaços do escritor no Século XIX.

## Descrição

Para a extração das citações, a aplicação utiliza a biblioteca python BeautifulSoup, que realiza consultas, requisições e coleta os dados da enciclopédia, estruturando-os de acordo com os parâmetros do schema.org. As citações coletadas são submetidas aos modelos GPT-3.5 e GPT-4 para obter os nomes atuais das localidades e sua classificação de acordo com a ontologia Geonames.org.

Ao final, são realizadas consultas SPARQL ao portal dados.literaturabrasileira.ufsc.br com o objetivo de obter identificadores únicos para cada livro, integrando mapas, citações e textos completos em conformidade com os padrões Linked Data.

## Funcionalidades

- **Mapa de citações por local**
- **Mapa de locais citados no conjunto da obra com verbetes**
- **Mapa de calor com a frequência de locais citados no conjunto da obra**
- **Mapa de citações a locais por obra**
- **Mapa de calor de citações por obra**

## Como Executar

1. Clone este repositório:
   ```bash
   git clone https://github.com/rocdav/MachadodeAssis.git
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
3. Execute o script principal:
   ```bash
   python main.py

Feito com 💻 por: Davi Machado da Rocha para a conclusão da disciplina de Introdução a Web Semântica no ICMC durante o 2º semestre de 2023.
