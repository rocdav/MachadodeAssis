import gradio as gr

def display_map(view_type):
    if view_type == "Mapa de citações por local":
        url = "https://gazetteer-machado.netlify.app/citacoes-por-local/"
    elif view_type == "Mapa de locais citados no conjunto da obra com verbetes":
        url = "https://gazetteer-machado.netlify.app/locais-com-verbetes/"
    elif view_type == "Mapa de calor com a frequência de locais citados no conjunto da obra":
        url = "https://gazetteer-machado.netlify.app/heatmap-geral/"
    elif view_type == "Mapa de citações a locais por obra":
        url = "https://gazetteer-machado.netlify.app/citacoes-por-obra/"
    elif view_type == "Mapa de calor de citações por obra":
        url = "https://gazetteer-machado.netlify.app/heatmap-por-obra/"
    elif view_type == "Grafo de relações por local":
        url = "https://gazetteer-machado.netlify.app/grafo-por-local/"
    elif view_type == "Mapa do Rio bairro a bairro":
        url = "https://gazetteer-machado.netlify.app/rio-bairro-a-bairro/"
    elif view_type == "Busca textual nas citações":
        url = "https://gazetteer-machado.netlify.app/buscar-citacoes/"
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
  font-size: 16px; /* Base font size for better readability on mobile */
}
.header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  padding: 10px; /* Add some padding for mobile */
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap; /* Allow content to wrap on smaller screens */
}
.scielo-link {
  text-align: center;
  margin-right: 20px;
}
.scielo-link img {
  width: 100px;
  margin: 10px;
  max-width: 100%; /* Ensure image doesn't overflow on small screens */
}
h1 {
  font-family: 'Garamond', serif;
  font-size: 2.5em;
  text-align: center;
  color: #5d4037;
  margin-top: 20px;
  word-wrap: break-word; /* Prevent overflow on small screens */
}
h2 {
  color: #5d4037;
  font-family: 'Garamond', serif;
  font-size: 2em;
  word-wrap: break-word; /* Prevent overflow on small screens */
}
a {
  color: #9e9d24;
  text-decoration: none;
}
.container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 90%; /* Use percentage width for better responsiveness */
  box-sizing: border-box; /* Include padding in width calculation */
}
.lead {
  font-style: italic;
  text-align: center;
  font-size: 1.2em;
}
.author {
  text-align: right;
  font-size: 1.2em;
  color: #5d4037;
  font-family: 'Garamond', serif;
  margin-top: 10px;
}
@media (max-width: 600px) {
  body {
    font-size: 14px; /* Slightly smaller base font size for mobile */
  }
  .header-content {
    flex-direction: column;
    align-items: center;
  }
  .scielo-link {
    order: -1;
    margin-right: 0;
    margin-bottom: 10px;
  }
  .scielo-link img {
    width: 80px;
    margin: 5px;
  }
  h1 {
    font-size: 1.8em;
  }
  h2 {
    font-size: 1.5em; /* Smaller subtitle for mobile */
  }
  .lead {
    font-size: 1em;
  }
  .container {
    padding: 15px; /* Smaller padding for mobile */
    margin: 10px auto; /* Smaller margin for mobile */
  }
  .author {
    font-size: 1em; /* Smaller author text for mobile */
  }
}
/* Add a media query for tablets */
@media (min-width: 601px) and (max-width: 1024px) {
  body {
    font-size: 15px;
  }
  h1 {
    font-size: 2.2em;
  }
  h2 {
    font-size: 1.8em;
  }
  .container {
    width: 95%;
  }
  /* Centralizar o .scielo-link */
  .header-content {
    flex-direction: column;
    align-items: center;
  }
  .scielo-link {
    margin-right: 0;
    margin-bottom: 15px;
    text-align: center;
  }
  .scielo-link img {
    width: 90px; /* Ajuste o tamanho conforme necessário */
  }
}
</style>
<div class="container">
  <div class="header-container">
    <img src="https://huggingface.co/spaces/histlearn/MachadodeAssis/resolve/main/head.png" alt="Header Image" style="width: 100%; max-width: 1000px; height: auto;">
    <div class="header-content">
      <a href="https://preprints.scielo.org/index.php/scielo/preprint/view/9474/version/10010" class="scielo-link" target="_blank">
        <img src="https://huggingface.co/spaces/histlearn/MachadodeAssis/resolve/main/preprints2.png" alt="SciELO Preprints">
        <p>Leia o manuscrito</p>
      </a>
      <div>
        <h1>Dicionário Geográfico e Literário de Machado de Assis</h1>
        <p class="lead">
          Dom Casmurro morava no Engenho Novo? Você já se perguntou onde fica o Engenho Novo e como ele se relaciona com a trama de Machado de Assis? Nosso projeto te leva a uma viagem no tempo e espaço, desvendando os cenários que inspiraram um dos maiores escritores brasileiros.
        </p>
        <p class="author">por Dilvan de Abreu Moreira e Davi Machado da Rocha</p>
      </div>
    </div>
  </div>
  <article>
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

with gr.Blocks() as demo:
    gr.HTML(description)
    with gr.Column(elem_classes="container"):
        gr.Markdown("""
        ## Como usar
        1. Selecione o tipo de visualização desejada no menu abaixo.
        2. O mapa correspondente será carregado automaticamente.
        3. Explore os diferentes aspectos das obras de Machado de Assis através dos mapas interativos.
        """)

        with gr.Column(elem_classes="controls"):
            view_type = gr.Radio(
                ["Mapa de citações por local",
                 "Mapa de locais citados no conjunto da obra com verbetes",
                 "Mapa de calor com a frequência de locais citados no conjunto da obra",
                 "Mapa de citações a locais por obra",
                 "Mapa de calor de citações por obra",
                 "Grafo de relações por local",
                 "Mapa do Rio bairro a bairro",
                 "Busca textual nas citações"],
                label="Selecione a visão do mapa"
            )
    
    with gr.Column(elem_classes="map-container"):
        map_display = gr.HTML()

    view_type.change(fn=display_map, inputs=view_type, outputs=map_display)

demo.launch()