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
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}
header {
    background-color: #5d4037;
    color: #fff;
    text-align: center;
    padding: 20px 0;
    margin-bottom: 20px;
}
h1 {
    font-family: 'Garamond', serif;
    font-size: 2.5em;
    margin: 0;
}
h2 {
    color: #5d4037;
    font-family: 'Garamond', serif;
    font-size: 2em;
}
.controls {
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
}
.map-container {
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 10px;
    padding: 20px;
    min-height: 600px;
}
footer {
    background-color: #5d4037;
    color: #fff;
    text-align: center;
    padding: 10px 0;
    margin-top: 20px;
}
.loading {
    display: none;
    text-align: center;
    font-style: italic;
    margin-top: 10px;
}
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
}
</style>
"""

with gr.Blocks(css=description) as demo:
    gr.HTML("""
    <header>
        <h1>Mapeando o Universo de Machado de Assis</h1>
        <p>Uma Jornada Interativa pelas Localidades de Suas Obras</p>
    </header>
    """)
    
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
                 "Ver endpoint SPARQL",
                 "Ver Grafos por local"],
                label="Selecione a visão do mapa"
            )
        
        with gr.Column(elem_classes="map-container"):
            map_display = gr.HTML()
            loading = gr.HTML('<div class="loading">Carregando mapa, por favor aguarde...</div>')
    
    def on_view_type_change(view):
        return gr.update(value='<div class="loading" style="display: block;">Carregando mapa, por favor aguarde...</div>')

    view_type.change(
        fn=on_view_type_change,
        inputs=view_type,
        outputs=loading
    ).then(
        fn=display_map,
        inputs=view_type,
        outputs=map_display
    )

demo.launch()
