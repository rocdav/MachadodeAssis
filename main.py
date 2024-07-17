import gradio as gr

def display_map(view_type):
    if view_type == "Mapa de citações por local":
        url = "https://cheery-cendol-3a987e.netlify.app/"
    elif view_type == "Mapa de locais citados no conjunto da obra com verbetes":
        url = "https://aquamarine-lamington-f1d38d.netlify.app/"
    elif view_type == "Mapa de calor com a frequência de locais citados no conjunto da obra":
        url = "https://sprightly-heliotrope-a6037e.netlify.app"
    elif view_type == "Mapa de citações a locais por obra":
        url = "https://gregarious-meerkat-7a7b8d.netlify.app/"
    elif view_type == "Mapa de calor de citações por obra":
        url = "https://starlit-rabanadas-af1d2b.netlify.app/"
    else:
        url = ""
    
    iframe = f'<iframe src="{url}" width="100%" height="600" frameborder="0"></iframe>'
    return iframe

description = """
<div style="text-align: justify; margin-bottom: 20px;">
    <h1>Projeto de Mapeamento das Obras de Machado de Assis</h1>
    <p>Este estudo tem o objetivo de desenvolver uma aplicação web semântica que mapeia localidades geográficas nas obras de Machado de Assis, armazenando-as em uma triplestore. A partir da integração dos dados disponibilizados pela enciclopédia MachadodeAssis.net com as coordenadas geográficas de Geonames.org e GoogleMaps, o projeto visa oferecer uma experiência de leitura através de mapas interativos, que servirão de suporte para as menções aos espaços realizadas pelo escritor ao longo do Século XIX.</p>
    <p>Para a extração das citações, a aplicação utiliza a biblioteca python BeautifulSoup que realiza consultas, requisições e coleta os dados da enciclopédia estruturando-os de acordo com os parâmetros do schema.org. As citações coletadas serão submetidas aos modelos gpt3.5-instruct e gpt4-turbo com o intuito de obter os nomes atuais das localidades, bem como a devida classificação destes espaços de acordo com a ontologia Geonames.org.</p>
    <p>Ao final, são realizadas consultas SPARQL ao portal dados.literaturabrasileira.ufsc.br com o objetivo de obter identificadores únicos para cada livro, oferecendo uma integração entre mapas, citações e textos completos, em consonância com os padrões Linked Data.</p>
</div>
"""

view_type = gr.Radio(
    ["Mapa de citações por local",
     "Mapa de locais citados no conjunto da obra com verbetes",
     "Mapa de calor com a frequência de locais citados no conjunto da obra",
     "Mapa de citações a locais por obra",
     "Mapa de calor de citações por obra"],
    label="Selecione a visão do mapa"
)

with gr.Blocks() as demo:
    gr.Markdown(description)
    with gr.Column():
        view_type.render()
        map_display = gr.HTML()
    view_type.change(fn=display_map, inputs=view_type, outputs=map_display)

demo.launch()
