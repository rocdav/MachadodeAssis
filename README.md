# Projeto de Mapeamento das Obras de Machado de Assis

Este estudo tem o objetivo de desenvolver uma aplicação web semântica que mapeia localidades geográficas nas obras de Machado de Assis, armazenando-as em uma triplestore. A partir da integração dos dados disponibilizados pela enciclopédia MachadodeAssis.net com as coordenadas geográficas de Geonames.org e GoogleMaps, o projeto visa oferecer uma experiência de leitura através de mapas interativos, que servirão de suporte para as menções aos espaços realizadas pelo escritor ao longo do Século XIX.

## Descrição

Para a extração das citações, a aplicação utiliza a biblioteca python BeautifulSoup que realiza consultas, requisições e coleta os dados da enciclopédia estruturando-os de acordo com os parâmetros do schema.org. As citações coletadas serão submetidas aos modelos gpt3.5-instruct e gpt4-turbo com o intuito de obter os nomes atuais das localidades, bem como a devida classificação destes espaços de acordo com a ontologia Geonames.org.

Ao final, são realizadas consultas SPARQL ao portal dados.literaturabrasileira.ufsc.br com o objetivo de obter identificadores únicos para cada livro, oferecendo uma integração entre mapas, citações e textos completos, em consonância com os padrões Linked Data.

## Funcionalidades

- Mapa de citações por local
- Mapa de locais citados no conjunto da obra com verbetes
- Mapa de calor com a frequência de locais citados no conjunto da obra
- Mapa de citações a locais por obra
- Mapa de calor de citações por obra

## Como Executar

1. Clone este repositório:
   ```bash
   git clone https://github.com/rocdavi/MachadodeAssis.git

2. Instale as dependências:
    ```bash
    pip install -r requirements.txt

3. Execute o script principal:
    ```bash
    python main.py

Feito com 💻 por: Davi Machado da Rocha para a conclusão da disciplina de Introdução a Web Semântica no ICMC durante o 2º semestre de 2023.

