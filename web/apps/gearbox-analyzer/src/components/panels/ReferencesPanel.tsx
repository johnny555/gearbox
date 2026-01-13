import { BookOpen, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"

interface Reference {
  title: string
  authors: string
  source: string
  links: { label: string; url: string }[]
}

const keyPapers: Reference[] = [
  {
    title: "Hybrid e-CVT Power Split Drivelines",
    authors: "Piero Corbelli",
    source: "PhD Thesis, University of Bologna",
    links: [
      { label: "PDF", url: "http://amsdottorato.unibo.it/3271/1/Corbelli_Piero_e-CVT_hybrid_driveline_applications.pdf" },
    ],
  },
  {
    title: "Modeling and Control of a Power-Split Hybrid Vehicle",
    authors: "Liu & Peng",
    source: "IEEE Trans. Control Systems Technology, 2008",
    links: [
      { label: "IEEE", url: "https://ieeexplore.ieee.org/document/4475524/" },
      { label: "PDF", url: "https://huei.engin.umich.edu/wp-content/uploads/sites/186/2015/02/Liu-TCST-split-paper.pdf" },
    ],
  },
  {
    title: "Modeling and Analysis of the Toyota Hybrid System",
    authors: "Liu, Peng & Filipi",
    source: "IEEE/ASME Int. Conf. Advanced Intelligent Mechatronics, 2005",
    links: [
      { label: "PDF", url: "https://www.engr.uvic.ca/~mech459/Pub_References/01500979.pdf" },
      { label: "ResearchGate", url: "https://www.researchgate.net/publication/265033863_Modeling_and_Analysis_of_the_Toyota_Hybrid_System" },
    ],
  },
  {
    title: "Powertrain configuration design for two mode power split HEV",
    authors: "Ke et al.",
    source: "Nature Scientific Reports, 2025",
    links: [
      { label: "Nature (Open Access)", url: "https://www.nature.com/articles/s41598-025-87378-w" },
    ],
  },
  {
    title: "Design of Power-Split Hybrid Vehicles with a Single Planetary Gear",
    authors: "Li, Zhang & Peng",
    source: "ASME Dynamic Systems and Control Conference, 2012",
    links: [
      { label: "PDF", url: "https://huei.engin.umich.edu/wp-content/uploads/sites/186/2015/02/DSCC-2012-Zhang.pdf" },
      { label: "ASME", url: "https://asmedigitalcollection.asme.org/DSCC/proceedings-abstract/DSCC2012-MOVIC2012/45301/857/229180" },
    ],
  },
  {
    title: "Optimal Design of Three-Planetary-Gear Power-Split Hybrid Powertrains",
    authors: "Zhuang et al.",
    source: "arXiv:1708.00151",
    links: [
      { label: "arXiv", url: "https://arxiv.org/abs/1708.00151" },
      { label: "PDF", url: "https://arxiv.org/pdf/1708.00151" },
    ],
  },
]

const onlineResources = [
  { title: "Graham Davies' PSD Explanation", url: "http://prius.ecrostech.com/original/Understanding/PowerSplitDevice.htm" },
  { title: "Alex Hart's PSD Page", url: "http://eahart.com/prius/psd/" },
  { title: "Tec-Science Willis Equation", url: "https://www.tec-science.com/mechanical-power-transmission/planetary-gear/transmission-ratios-of-planetary-gears-willis-equation/" },
  { title: "MathWorks Power-Split HEV Model", url: "https://www.mathworks.com/help/sps/ug/hybrid-electric-vehicle-model.html" },
]

export function ReferencesPanel() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          References
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>References & Resources</DialogTitle>
          <DialogDescription>
            Key papers and resources for e-CVT and power-split transmission simulation
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-2 space-y-6">
          {/* Key Papers Section */}
          <section>
            <h3 className="text-sm font-semibold text-secondary mb-3">Key Papers</h3>
            <div className="space-y-3">
              {keyPapers.map((ref, i) => (
                <div key={i} className="p-3 rounded-md bg-dark border border-subtle">
                  <h4 className="text-sm font-medium text-primary">{ref.title}</h4>
                  <p className="text-xs text-muted mt-1">{ref.authors} — {ref.source}</p>
                  <div className="flex gap-2 mt-2">
                    {ref.links.map((link, j) => (
                      <a
                        key={j}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Online Resources Section */}
          <section>
            <h3 className="text-sm font-semibold text-secondary mb-3">Online Resources</h3>
            <div className="grid grid-cols-2 gap-2">
              {onlineResources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-md bg-dark border border-subtle hover:border-accent transition-colors text-sm text-primary"
                >
                  <ExternalLink className="h-3 w-3 text-muted flex-shrink-0" />
                  <span className="truncate">{resource.title}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Key Equations */}
          <section>
            <h3 className="text-sm font-semibold text-secondary mb-3">Key Equations</h3>
            <div className="p-3 rounded-md bg-dark border border-subtle font-mono text-xs space-y-2">
              <div>
                <span className="text-muted">Willis Equation:</span>
                <span className="text-primary ml-2">ωs·Zs + ωr·Zr = ωc·(Zs + Zr)</span>
              </div>
              <div>
                <span className="text-muted">Torque Balance:</span>
                <span className="text-primary ml-2">τs + τr + τc = 0</span>
              </div>
              <div>
                <span className="text-muted">Prius Ratio:</span>
                <span className="text-primary ml-2">τr/τs = 78/30 = 2.6</span>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
