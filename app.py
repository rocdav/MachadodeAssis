import gradio as gr

def display_map(view_type):
    if view_type == "Mapa de citações por local":
        url = "https://gregarious-smakager-0d5f64.netlify.app/"
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
    else:
        url = ""
    
    iframe = f'<iframe src="{url}" width="100%" height="600" frameborder="0"></iframe>'
    return iframe

description = """
<div class="container">
  <article>
    <header>
      <h1>Mapeando o Universo de Machado de Assis: Uma Jornada Interativa pelas Localidades de Suas Obras</h1>
      <p class="lead">
        "Dom Casmurro morava no Engenho Novo." Você já se perguntou onde fica o Engenho Novo e como ele se relaciona com a trama de Machado de Assis? Nosso projeto te leva a uma viagem no tempo e espaço, desvendando os cenários que inspiraram um dos maiores escritores brasileiros.
      </p>
    </header>
    <section>
      <h2>Uma Aplicação Web Semântica Inovadora</h2>
      <p>
        Desenvolvemos uma aplicação web semântica que mapeia as localidades geográficas mencionadas nas obras de Machado de Assis, utilizando dados da enciclopédia <a href="https://machadodeassis.net/" target="_blank">Machadodeassis.net</a>, coordenadas geográficas de Geonames.org e Google Maps. Imagine explorar um mapa interativo que te transporta para o Rio de Janeiro do século XIX, revelando os locais onde Dom Casmurro, Bentinho e Capitu viveram suas paixões e dramas.
      </p>
    </section>
    <section>
      <h2>Tecnologia de Ponta a Serviço da Literatura</h2>
      <p>
        Nossa aplicação utiliza a biblioteca Python BeautifulSoup para extrair citações das obras de Machado de Assis, e os modelos GPT-3.5 e GPT-4 para identificar e classificar as localidades mencionadas. Através de consultas SPARQL ao portal <a href="http://dados.literaturabrasileira.ufsc.br" target="_blank">dados.literaturabrasileira.ufsc.br</a>, integramos mapas, citações e textos completos, seguindo os padrões Linked Data.
      </p>
    </section>
    <section>
      <h2>Uma Estrutura de Dados Inteligente</h2>
      <figure>
        <img src="https://huggingface.co/spaces/histlearn/MachadodeAssis/resolve/main/grafooo.png" alt="Estrutura de Dados" style="max-width: 50%; height: auto; border: 1px solid #000; display: block; margin-left: auto; margin-right: auto;">
        <figcaption style="text-align: center;">Nossa estrutura de dados, ilustrada acima, garante a organização e interligação das informações, permitindo uma navegação intuitiva e enriquecedora pelo universo machadiano.</figcaption>
      </figure>
    </section>
    <section>
      <h2>Explore, Descubra e Mergulhe na História</h2>
      <p>
        Convidamos você a explorar nossa aplicação web e embarcar em uma jornada única pelas páginas de Machado de Assis. Descubra os cenários que inspiraram suas histórias, mergulhe na atmosfera do Rio de Janeiro do século XIX e vivencie a literatura de uma forma totalmente nova.
      </p>
      <div class="call-to-action" style="text-align: center;">
        <a href="[Link para a aplicação web]" class="btn" style="margin: 5px;">Explorar a Aplicação</a>
        <a href="[Link para fornecer feedback]" class="btn" style="margin: 5px;">Fornecer Feedback</a>
        <a href="[Link para contribuir com o projeto]" class="btn" style="margin: 5px;">Contribuir com o Projeto</a>
      </div>
    </section>
  </article>
</div>
"""

view_type = gr.Radio(
    ["Mapa de citações por local",
     "Mapa de locais citados no conjunto da obra com verbetes",
     "Mapa de calor com a frequência de locais citados no conjunto da obra",
     "Mapa de citações a locais por obra",
     "Mapa de calor de citações por obra",
     "Ver endpoint SPARQL"],
    label="Selecione a visão do mapa"
)

with gr.Blocks() as demo:
    gr.HTML(description)
    with gr.Column():
        view_type.render()
        map_display = gr.HTML()
    view_type.change(fn=display_map, inputs=view_type, outputs=map_display)

demo.launch()
