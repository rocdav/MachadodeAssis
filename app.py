import gradio as gr

def display_map(view_type):
    if view_type == "Mapa de citações por local":
        url = "https://dancing-lebkuchen-90896f.netlify.app/"
    elif view_type == "Mapa de locais citados no conjunto da obra com verbetes":
        url = "https://aquamarine-lamington-f1d38d.netlify.app/"
    elif view_type == "Mapa de calor com a frequência de locais citados no conjunto da obra":
        url = "https://sprightly-heliotrope-a6037e.netlify.app"
    elif view_type == "Mapa de citações a locais por obra":
        url = "https://gregarious-meerkat-7a7b8d.netlify.app/"
    elif view_type == "Mapa de calor de citações por obra":
        url = "https://starlit-rabanadas-af1d2b.netlify.app/"
    elif view_type == "Ver endpoint SPARQL":
        url = "https://histlearn-jenafuseki.hf.space/#/dataset/Gazetteer/query"
    elif view_type == "Ver Grafos por local":
        url = "https://histlearn-showgraph.hf.space"
    else:
        url = ""
    
    iframe = f'<iframe src="{url}" width="100%" height="600" frameborder="0"></iframe>'
    return iframe

description = """
<style>
body {
  font-family: 'Georgia', serif;
  line-height: 1.6;
  background-color: #f2e9e1;
  color: #333;
  margin: 0;
  padding: 0;
}
h1 {
  font-family: 'Garamond', serif;
  font-size: 2.5em;
  text-align: center;
  color: #5d4037;
  margin-top: 20px;
}
h2 {
  color: #5d4037; /* Cor dos subtítulos (marrom mais escuro) */
  font-family: 'Garamond', serif; /* Fonte para os subtítulos */
  font-size: 2em; /* Tamanho da fonte dos subtítulos */
}
a {
  color: #9e9d24; /* Cor dos links (amarelo dourado) */
  text-decoration: none; /* Remover sublinhado dos links */
}
.container {
  max-width: 1000px; /* Largura máxima do contêiner */
  margin: 20px auto; /* Centralizar o contêiner e adicionar margem */
  padding: 20px; /* Espaçamento interno do contêiner */
  background-color: #fff; /* Cor de fundo do contêiner */
  border: 1px solid #ccc; /* Borda do contêiner */
  border-radius: 10px; /* Bordas arredondadas */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Sombra para o contêiner */
  position: relative; /* Adicionado para alinhar a imagem dentro do container */
}
.lead {
  font-style: italic; /* Itálico para a citação inicial */
  text-align: center; /* Centralizar a citação inicial */
  font-size: 1.2em; /* Aumentar o tamanho do texto */
}
.author {
  text-align: left; /* Alinhar os autores à esquerda */
  font-size: 1.2em;
  color: #5d4037;
  font-family: 'Garamond', serif;
  margin-top: 10px; /* Espaçamento acima do texto dos autores */
}
.scielo-link {
  text-align: center;
  margin-bottom: 20px; /* Adiciona espaço entre o logo e o título */
}
.scielo-link img {
  width: 100px;
  margin: 10px;
  align: center;
}
</style>
<div class="container">
  <a href="https://preprints.scielo.org/index.php/scielo/preprint/view/9474/version/10010" class="scielo-link" target="_blank">
    <img src="https://huggingface.co/spaces/histlearn/MachadodeAssis/resolve/main/preprints2.png" alt="SciELO Preprints">
    <p>Leia o manuscrito</p>
  </a>
  <article>
    <header>
      <h1>Dicionário Geográfico e Literário de Machado de Assis</h1>
      <p class="lead">
        "Dom Casmurro morava no Engenho Novo." Você já se perguntou onde fica o Engenho Novo e como ele se relaciona com a trama de Machado de Assis? Nosso projeto te leva a uma viagem no tempo e espaço, desvendando os cenários que inspiraram um dos maiores escritores brasileiros.
      </p>
      <p class="author">por Dilvan de Abreu Moreira e Davi Machado da Rocha</p>
    </header>
    <section>
      <h2>Web Semântica</h2>
      <p>
        Desenvolvemos uma aplicação web semântica que mapeia as localidades geográficas mencionadas nas obras de Machado de Assis, utilizando dados da enciclopédia <a href="https://machadodeassis.net/" target="_blank">Machadodeassis.net</a>, coordenadas geográficas de Geonames.org e Google Maps. Os excertos da obra aparecem localizados em um mapa interativo, o que permite uma melhor compreensão do espaço e do contexto na obra. Ao visualizar as passagens literárias mapeadas geograficamente, é possível obter uma percepção mais profunda de como os locais influenciam e enriquecem as narrativas de Machado de Assis. Isso oferece aos leitores uma maneira de explorar os cenários descritos, revelando a conexão entre as tramas e os espaços geográficos que inspiraram o autor.
      </p>
    </section>
    <section>
      <h2>Tecnologia a serviço da Literatura Brasileira</h2>
      <p>
        Nossa aplicação utiliza a biblioteca Python BeautifulSoup para extrair citações das obras de Machado de Assis, e os modelos GPT-3.5 e GPT-4 para identificar e classificar as localidades mencionadas. Através de consultas SPARQL ao portal <a href="http://dados.literaturabrasileira.ufsc.br" target="_blank">dados.literaturabrasileira.ufsc.br</a>, integramos mapas, citações e textos completos, seguindo os padrões Linked Data.
      </p>
    </section>
    <section>
      <h2>Estrutura de dados inteligente</h2>
      <figure>
        <img src="https://huggingface.co/spaces/histlearn/MachadodeAssis/resolve/main/grafooo.png" alt="Estrutura de Dados" style="max-width: 70%; height: auto; border: 1px solid #000; display: block; margin-left: auto; margin-right: auto;">
        <figcaption style="text-align: center;">Nossa estrutura de dados, ilustrada acima, garante a organização e interligação das informações, permitindo uma navegação intuitiva e enriquecedora pelo universo machadiano.</figcaption>
      </figure>
    </section>
  </article>
</div>
"""

with gr.Blocks(css=description) as demo:
    gr.HTML(description)
    with gr.Column(elem_classes="container"):
        gr.Markdown("""
        ## Como usar
        1. Selecione o tipo de visualização desejada no menu abaixo.
        2. O mapa correspondente será carregado automaticamente.
        3. Explore os diferentes aspectos das obras de Machado de Assis através dos mapas interativos.
        4. É possível fazer consultas SPARQL ao arquivo de dados através do Jena Fuseki.
        5. Os grafos das consultas aos locais também estão disponíveis.
        """)
        
        with gr.Column(elem_classes="controls"):
            view_type = gr.Radio(
                ["Mapa de citações por local",
                 "Mapa de locais citados no conjunto da obra com verbetes",
                 "Mapa de calor com a frequência de locais citados no conjunto da obra",
                 "Mapa de citações a locais por obra",
                 "Mapa de calor de citações por obra",
                 "Ver endpoint SPARQL",
                 "Ver Grafos por local"],
                label="Selecione a visão do mapa"
            )
    
    with gr.Column(elem_classes="map-container"):
        map_display = gr.HTML()

    view_type.change(fn=display_map, inputs=view_type, outputs=map_display)

demo.launch()
